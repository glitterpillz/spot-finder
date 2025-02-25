const express = require("express");
const { Op, where } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../../db/models");

const {
  setTokenCookie,
  restoreUser,
  requireAuth,
} = require("../../utils/auth");
const { User, Spot, Review, ReviewImage, Booking } = require("../../db/models");

const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();

router.use(restoreUser);

const validateLogin = [
  check("credential")
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage("Email or username is required"),
  check("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required"),
  handleValidationErrors,
];

// LOGIN USER
router.post("/login", validateLogin, async (req, res, next) => {
  const { credential, password } = req.body;

  const user = await User.unscoped().findOne({
    where: {
      [Op.or]: {
        username: credential,
        email: credential,
      },
    },
  });

  if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
    const err = new Error("The provided credentials were invalid.");
    err.status = 401;
    err.title = "Login failed";
    err.errors = { credential: "The provided credentials were invalid." };
    return next(err);
  }

  const safeUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username,
  };

  await setTokenCookie(res, safeUser);

  return res.json({
    user: safeUser,
  });
});

// GET USER SPOTS
// router.get("/spots", requireAuth, async (req, res) => {
//   const userId = req.user.id;

//   const spots = await Spot.findAll({ where: { ownerId: userId } });

//   res.json({ Spots: spots });
// });
router.get("/spots", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const spots = await Spot.findAll({
    where: { ownerId: userId },
  });

  // Calculate avgRating and numReviews
  const formattedSpots = await Promise.all(
    spots.map(async (spot) => {
      const numReviews = await Review.count({ where: { spotId: spot.id } });
      const avgRating = await Review.findOne({
        where: { spotId: spot.id },
        attributes: [[sequelize.fn("AVG", sequelize.col("stars")), "avgRating"]],
        raw: true,
      });

      const previewImage = spot.previewImage || null;

      return {
        ...spot.toJSON(),
        numReviews,
        avgRating: avgRating ? parseFloat(avgRating.avgRating).toFixed(2) : "0.0",
        previewImage,
      };
    })
  );

  res.json({ Spots: formattedSpots });
});

// GET USER REVIEWS
router.get("/reviews", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const reviews = await Review.findAll({
    where: { userId },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: Spot,
        attributes: [
          "id",
          "ownerId",
          "address",
          "city",
          "state",
          "country",
          "name",
          "price",
          "previewImage",
        ],
      },
      {
        model: ReviewImage,
        as: "ReviewImages",
        attributes: ["id", "url"],
      },
    ],
  });

  res.json({ Reviews: reviews });
});

// GET USER BOOKINGS
router.get("/bookings", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const bookings = await Booking.findAll({
    where: { userId },
    include: [
      {
        model: Spot,
        attributes: [
          "id",
          "ownerId",
          "address",
          "city",
          "state",
          "country",
          "name",
          "price",
          "previewImage",
        ],
      },
    ],
  });

  res.json({ Bookings: bookings });
});

// LOGOUT (DELETE SESSION)
router.delete("/", (_req, res) => {
  res.clearCookie("token");
  return res.json({ message: "success" });
});

// GET CURRENT USER
router.get("/", (req, res) => {
  const { user } = req;
  if (user) {
    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };
    return res.json({
      user: safeUser,
    });
  } else return res.json({ user: null });
});

module.exports = router;
