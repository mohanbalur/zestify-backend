import Restaurant from "../models/Restaurant.model.js";

// GET /api/restaurants
export const getRestaurants = async (req, res) => {
  try {
    const {
      sort,
      cuisine,
      isOpen,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (cuisine) {
      query.cuisines = { $in: [cuisine] };
    }

    if (isOpen !== undefined) {
      query.isOpen = isOpen === "true";
    }

    let sortOption = {};
    if (sort === "rating") sortOption.rating = -1;
    if (sort === "deliveryTime") sortOption.deliveryTime = 1;

    const restaurants = await Restaurant.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
};

// GET /api/restaurants/search?q=
export const searchRestaurants = async (req, res) => {
  try {
    const { q } = req.query;

    const restaurants = await Restaurant.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { cuisines: { $regex: q, $options: "i" } }
      ]
    });

    res.status(200).json(restaurants);
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

    const restaurants = await Restaurant.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: 5000 // 5km
        }
      }
    });

    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch nearby restaurants" });
  }
};
