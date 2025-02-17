const router = require("express").Router();
const { handleValidationErrors } = require("../../utils/validation");
const { requireAuth } = require("../../utils/auth");
const { check, query } = require("express-validator");
const { Op } = require("sequelize");

const {
  Spot,
  User,
  SpotImage,
  Review,
  ReviewImage,
} = require("../../db/models");

// DELETE SPOT IMAGE
router.delete("/:spotId/images/:imageId", requireAuth, async (req, res) => {
  const ownerId = req.user.id;
  const { spotId, imageId } = req.params;

  const spot = await Spot.findOne({
    where: {
      id: spotId,
    },
  });

  if (!spot) {
    res.status(404).json({ message: "Spot couldn't be found" });
  }

  if (spot.ownerId !== ownerId) {
    res.status(403).json({ message: "Forbidden" });
  }

  const spotImage = await SpotImage.findOne({
    where: {
      id: imageId,
      spotId,
    },
  });

  if (!spotImage) {
    res.status(404).json("Spot Image couldn't be found");
  }

  await spotImage.destroy();

  res.status(200).json({
    message: "Successfully deleted",
  });
});


// GET SPOT REVIEWS
router.get("/:spotId/reviews", async (req, res) => {
  try {
    const spotId = req.params.spotId;

    const reviews = await Review.findAll({
      where: { spotId },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: ReviewImage,
          as: "ReviewImages",
          attributes: ["id", "url"],
        },
      ],
    });

    if (reviews.length === 0) {
      res.status(404).json({ message: "Spot couldn't be found" });
    }

    res.json({ Reviews: reviews });
  } catch (err) {
    console.error("Error getting spot reviews: ", err);
    res.status(500).json({ message: "Error getting spot reviews" });
  }
});


// GET SPOT BY ID
router.get("/:spotId", async (req, res) => {
  try {
    const spotId = req.params.spotId;

    const spot = await Spot.findByPk(spotId, {
      include: [
        {
          model: SpotImage,
          as: "SpotImages",
          attributes: ["id", "url", "preview"],
        },
        {
          model: User,
          as: "Owner",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: Review,
          as: "Reviews",
          attributes: ["id", "review", "stars", "createdAt"],
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        },
      ],
    });

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    const avgRating = await spot.getAvgRating();
    const numReviews = await spot.getNumReviews();

    res.status(200).json({
      ...spot.toJSON(),
      avgRating,
      numReviews,
    });
  } catch (err) {
    console.error("Error fetching spot details: ", err);
    res.status(500).json({ message: "Error fetching spot details" });
  }
});


const { singleMulterUpload, awsUploadFile } = require("../../awsS3"); // Import AWS functions

// POST SPOT IMAGES (Updated)
router.post("/:spotId/images", requireAuth, singleMulterUpload("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const uploadResult = await awsUploadFile(req.file);
    res.status(200).json(uploadResult);
  } catch (error) {
    console.error("AWS upload error:", error);
    res.status(500).json({ message: "Failed to upload file to AWS", error: error.message });
  }
});



// EDIT SPOT
router.put(
  "/:spotId",
  requireAuth,
  [
    check("address")
      .exists({ checkFalsey: true })
      .isLength({ min: 1 })
      .withMessage("Street address is required"),
    check("city")
      .exists({ checkFalsey: true })
      .isLength({ min: 1 })
      .withMessage("City is required"),
    check("state")
      .exists({ checkFalsey: true })
      .isLength({ min: 1 })
      .withMessage("State is required"),
    check("country")
      .exists({ checkFalsey: true })
      .isLength({ min: 1 })
      .withMessage("Country is required"),
    check("name")
      .exists({ checkFalsey: true })
      .isLength({ max: 50 })
      .withMessage("Name must be less than 50 characters"),
    check("description")
      .exists({ checkFalsey: true })
      .isLength({ min: 1, max: 500 }) 
      .withMessage("Description must be between 1 and 500 characters"),
    check("price")
      .exists({ checkFalsey: true })
      .isFloat({ gt: 0 })
      .withMessage("Price per day must be a positive number"),
    handleValidationErrors,
  ],
  async (req, res) => {
    const ownerId = req.user.id;
    const { spotId } = req.params;
    const {
      address,
      city,
      state,
      country,
      name,
      description,
      price,
    } = req.body;

    const spotToUpdate = await Spot.findOne({
      where: { id: spotId },
      include: [
        { model: Review },
        { model: SpotImage },
        { model: User, as: 'Owner' }
      ],
    });

    if (!spotToUpdate) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    if (spotToUpdate.ownerId !== ownerId) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    spotToUpdate.address = address;
    spotToUpdate.city = city;
    spotToUpdate.state = state;
    spotToUpdate.country = country;
    spotToUpdate.name = name;
    spotToUpdate.description = description;
    spotToUpdate.price = price;


    await spotToUpdate.save();

    res.status(200).json(spotToUpdate);
  }
);


// DELETE SPOT
router.delete("/:spotId", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { spotId } = req.params;

    const spotToDelete = await Spot.findOne({
      where: {
        id: spotId,
      },
    });

    if (!spotToDelete) {
      res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    if (spotToDelete.ownerId !== userId) {
      res.status(403).json({
        message: "Forbidden",
      });
    }

    await spotToDelete.destroy();

    res.status(200).json({
      message: "Successfully deleted",
    });
  } catch {
    console.error("Error deleting spot:", err);
    res.status(500).json({
      message: "Error deleting spot",
    });
  }
});


// GET SPOTS
router.get(
  "/",
  [
    check("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be greater than or equal to 1"),
    check("size")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Size must be between 1 and 20"),
    check("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Minimum price must be greater than or equal to 0"),
    check("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Maximum price must be greater than or equal to 0"),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      let { page, size, minPrice, maxPrice } = req.query;

      // Set pagination defaults
      page = parseInt(page) || 1;
      size = parseInt(size) || 20;
      const limit = size;
      const offset = (page - 1) * size;

      let where = {};

      // Apply price filtering if provided
      if (minPrice && maxPrice) {
        where.price = { [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)] };
      } else if (minPrice) {
        where.price = { [Op.gte]: parseFloat(minPrice) };
      } else if (maxPrice) {
        where.price = { [Op.lte]: parseFloat(maxPrice) };
      }

      const spots = await Spot.findAll({
        where,
        limit,
        offset,
        include: [
          {
            model: SpotImage,
            as: "SpotImages",
            attributes: ["url", "preview"],
          },
        ],
      });

      // Add average rating and preview image to each spot
      const formattedSpots = await Promise.all(
        spots.map(async (spot) => {
          const avgRating = await spot.getAvgRating();
          const previewImage = spot.SpotImages.find((img) => img.preview)?.url || null;
          return {
            ...spot.toJSON(),
            avgRating,
            previewImage,
          };
        })
      );

      res.status(200).json({
        Spots: formattedSpots,
        page,
        size,
      });
    } catch (err) {
      console.error("Error fetching spots:", err);
      res.status(500).json({
        message: "Unexpected error",
      });
    }
  }
);

// router.get(
//   "/",
//   [
//     check("page")
//       .optional()
//       .isInt({ min: 1 })
//       .withMessage("Page must be greater than or equal to 1"),
//     check("size")
//       .optional()
//       .isInt({ min: 1, max: 20 })
//       .withMessage("Size must be between 1 and 20"),
//     check("minPrice")
//       .optional()
//       .isFloat({ min: 0 })
//       .withMessage("Minimum price must be greater than or equal to 0"),
//     check("maxPrice")
//       .optional()
//       .isFloat({ min: 0 })
//       .withMessage("Maximum price must be greater than or equal to 0"),
//     handleValidationErrors,
//   ],
//   async (req, res) => {
//     try {
//       let page = parseInt(req.query.page) || 1;
//       let size = parseInt(req.query.size) || 20;

//       let where = {};

//       if (req.query.minPrice) {
//         where.price = parseFloat(req.query.minPrice);
//       }

//       if (req.query.maxPrice) {
//         where.price = parseFloat(req.query.maxPrice);
//       }

//       let limit = size;
//       let offset = (page - 1) * size;

//       const spots = await Spot.findAll({
//         where,
//         offset,
//         limit,
//       });

//       spots.forEach((spot) => {
//         avgRating = spot.avgRating();
//         numReviews = spot.numReviews();
//       })

//       res.status(200).json({
//         Spots: spots,
//         avgRating,
//         numReviews,
//         page: page,
//         size: size,
//       });
//     } catch (err) {
//       res.status(500).json({
//         message: "Unexpected error: skill issue",
//       });
//     }
//   }
// );


// POST NEW SPOT
router.post(
  "/",
  requireAuth,
  [
    check("address")
      .exists({ checkFalsey: true })
      .isLength({ min: 1 })
      .withMessage("Street address is required"),
    check("city")
      .exists({ checkFalsey: true })
      .isLength({ min: 1 })
      .withMessage("City is required"),
    check("state")
      .exists({ checkFalsey: true })
      .isLength({ min: 1 })
      .withMessage("State is required"),
    check("country")
      .exists({ checkFalsey: true })
      .isLength({ min: 1 })
      .withMessage("Country is required"),
    check("name")
      .exists({ checkFalsey: true })
      .isLength({ max: 50 })
      .withMessage("Name must be less than 50 characters"),
    check("description")
      .exists({ checkFalsey: true })
      .isLength({ min: 1, max: 500 })
      .withMessage("Description must be between 1 and 500 characters"),
    check("price")
      .exists({ checkFalsey: true })
      .isFloat({ gt: 0 })
      .withMessage("Price per day must be a positive number"),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const {
        address,
        city,
        state,
        country,
        name,
        description,
        price,
      } = req.body;

      const userId = req.user.id;

      const newSpot = await Spot.create({
        ownerId: userId,
        address,
        city,
        state,
        country,
        name,
        description,
        price,
      });

      res.status(201).json(newSpot);   
    } catch (err) {
      console.error("Error creating spot:", err);
      res.status(500).json({
        message: "Error creating spot",
      });
    }
  }
);


module.exports = router;
