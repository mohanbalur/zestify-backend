import Restaurant from "../models/Restaurant.model.js";
import MenuItem from "../models/MenuItem.model.js";
import Category from "../models/Category.model.js";

// GET /api/restaurants
export const getRestaurants = async (req, res) => {
  try {
    const {
      sort,
      cuisine,
      isOpen,
      page = 1,
      limit = 20,

      // 🔥 NEW FILTER PARAMS
      minRating,
      isPureVeg,
      hasOffer,
      minPrice,
      maxPrice
    } = req.query;

    const query = {};

    // Existing filters
    if (cuisine) {
      query.cuisines = { $in: [cuisine] };
    }

    if (isOpen !== undefined) {
      query.isOpen = isOpen === "true";
    }

    // 🔥 NEW FILTER LOGIC
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    if (isPureVeg !== undefined) {
      query.isPureVeg = isPureVeg === "true";
    }

    if (hasOffer !== undefined) {
      query.hasOffer = hasOffer === "true";
    }

    if (minPrice || maxPrice) {
      query.avgPriceForTwo = {};
      if (minPrice) query.avgPriceForTwo.$gte = Number(minPrice);
      if (maxPrice) query.avgPriceForTwo.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOption = {};
    if (sort === "rating") sortOption.rating = -1;
    if (sort === "deliveryTime") sortOption.deliveryTime = 1;

    const restaurants = await Restaurant.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Restaurant.countDocuments(query);

    res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      restaurants
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
};


// GET /api/restaurants/search?q=
export const searchRestaurants = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(200).json({
        success: true,
        data: {
          restaurants: [],
          menuItems: []
        }
      });
    }

    // 1. Search Restaurants
    const restaurants = await Restaurant.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { cuisines: { $regex: q, $options: "i" } }
      ],
      isOpen: true,
      isDeleted: false
    });

    // 2. Search Menu Items
    const menuItems = await MenuItem.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ],
      isAvailable: true,
      isDeleted: false
    }).populate('restaurant');

    const validMenuItems = menuItems.filter(item =>
      item.restaurant &&
      !item.restaurant.isDeleted &&
      item.restaurant.isOpen
    );

    // 3. Search Categories
    const categories = await Category.find({
      name: { $regex: q, $options: "i" },
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: {
        restaurants,
        menuItems: validMenuItems,
        categories
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
};

// GET /api/restaurants/:id
export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch restaurant" });
  }
};

// GET /api/restaurants/nearby?lat=&lng=
export const getNearbyRestaurants = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude required" });
    }

    // In a real production app at scale, we'd use an aggregation pipeline 
    // to match against each restaurant's individual serviceRadius.
    // For this implementation, we fetch nearby and sort by distance.
    // Use aggregation to calculate distance and filter by individual serviceRadius
    const restaurants = await Restaurant.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: "distance", // meters
          maxDistance: 20000, // Hard limit 20km
          spherical: true,
          query: { isDeleted: false, isOpen: true }
        }
      },
      {
        $addFields: {
          distanceKm: { $divide: ["$distance", 1000] }
        }
      },
      {
        $match: {
          $expr: {
            $lte: ["$distanceKm", { $ifNull: ["$serviceRadius", 5] }]
          }
        }
      },
      {
        $sort: { distance: 1 }
      },
      {
        $project: {
          name: 1,
          location: 1,
          distanceKm: 1,
          serviceRadius: 1,
          rating: 1,
          cuisines: 1,
          avgPriceForTwo: 1,
          imageUrl: 1,
          isOpen: 1
        }
      }
    ]);

    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch nearby restaurants" });
  }
};
