const router = require("express").Router();

const { requireAuth } = require("../../utils/auth");
const { Review, Spot, ReviewImage } = require("../../db/models");

const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const { where } = require("sequelize");

// DELETE REVIEW IMAGE
router.delete("/:reviewId/images/:imageId", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { reviewId, imageId } = req.params;

  const review = await Review.findOne({ where: { id: reviewId } });

  if (!review) {
    res.status(404).json({ message: "Review couldn't be found" });
  }

  if (review.userId !== userId) {
    res.status(403).json({ message: "Forbidden" });
  }

  const reviewImageToDelete = await ReviewImage.findOne({
    where: { id: imageId, reviewId },
  });

  if (!reviewImageToDelete) {
    return res.status(404).json({ message: "Review Image couldn't be found" });
  }

  await reviewImageToDelete.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
});


// POST REVIEW IMAGE
router.post("/:reviewId/images", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { reviewId } = req.params;
  const { url } = req.body;

  const review = await Review.findOne({ where: { id: reviewId } });

  if (!review) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  if (review.userId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const allReviewImages = await ReviewImage.findAll({ where: { reviewId } });

  if (allReviewImages.length >= 10) {
    return res.status(403).json({
      message: "Maximum number of images for this resource was reached",
    });
  }

  const newReviewImage = await ReviewImage.create({
    reviewId,
    url,
    preview: false,
  });

  res.status(201).json(newReviewImage);
});


// EDIT REVIEW
router.put(
  "/:reviewId",
  requireAuth,
  [
    check("review")
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage("Review text is required"),
    check("stars")
      .exists({ checkFalsy: true })
      .isInt({ min: 1, max: 5 })
      .withMessage("Stars must be an integer from 1 to 5"),
    handleValidationErrors,
  ],
  async (req, res) => {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { review, stars } = req.body;

    const reviewToUpdate = await Review.findOne({
      where: { id: reviewId },
    });

    if (!reviewToUpdate) {
      return res.status(403).json({ message: "Review couldn't be found" });
    }

    if (reviewToUpdate.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    reviewToUpdate.review = review;
    reviewToUpdate.stars = stars;

    await reviewToUpdate.save();

    const spot = await reviewToUpdate.getSpot();
    
    return res.status(200).json({
      review: {
        ...reviewToUpdate.toJSON(),
        spotId: spot.id
      }
    });
  }
);


// DELETE REVIEW
router.delete("/:reviewId", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { reviewId } = req.params;

  const review = await Review.findOne({ where: { id: reviewId } });

  if (!review) {
    return res.status(404).json({ message: "Review couldn't be found" });
  };

  if (review.userId !== userId) {
    return res.status(403).json({ message: 'Forbidden' })
  };

  await review.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
});


// POST NEW REVIEW
router.post(
  "/:spotId",
  requireAuth,
  [
    check("review")
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage("Review text is required"),
    check("stars")
      .exists({ checkFalsy: true })
      .isInt({ min: 1, max: 5 })
      .withMessage("Stars must be an integer from 1 to 5"),
    handleValidationErrors,
  ],
  async (req, res) => {
    const userId = req.user.id;
    const { spotId } = req.params;
    const { review, stars } = req.body;

    const spot = await Spot.findOne({ where: { id: spotId } });

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    const allReviews = await Review.findAll({ where: { userId, spotId } });

    if (allReviews.length !== 0) {
      return res
        .status(500)
        .json({ message: "User already has a review for this spot" });
    }

    const newReview = await Review.create({
      userId,
      spotId,
      review,
      stars,
    });

    const reviews = await Review.findAll({ where: { spotId }});
    const numReviews = reviews.length;
    const sumOfRatings = reviews.reduce((sum, review) => sum + review.stars, 0);

    const avgRating = parseFloat(sumOfRatings / numReviews).toFixed(1);
    await Spot.update({ numReviews, avgRating }, { where: { id: spotId } })

    return res.status(201).json(newReview);
  }
);


module.exports = router;
