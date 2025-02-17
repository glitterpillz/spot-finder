"use strict";
const { Model, DATE } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    static associate(models) {
      Spot.belongsTo(models.User, {
        as: "Owner",
        foreignKey: "ownerId",
      });
      Spot.hasMany(models.Booking, {
        foreignKey: "spotId",
      });
      Spot.hasMany(models.Review, {
        foreignKey: "spotId",
      });
      Spot.hasMany(models.SpotImage, {
        foreignKey: "spotId",
      });
    }

    async getAvgRating() {
      const reviews = await this.getReviews({
        attributes: [[sequelize.fn("AVG", sequelize.col("stars")), "avgRating"]],
        raw: true,
      });

      return reviews[0].avgRating ? parseFloat(reviews[0].avgRating).toFixed(2) : "New";
    }

    async getNumReviews() {
      const count = await this.countReviews();
      return count;
    }
  }
  Spot.init(
    {
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      address: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          len: [1, 500],
        },
      },
      city: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          len: [1, 150],
        },
      },
      state: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          len: [1, 150],
        },
      },
      country: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          len: [1, 150],
        },
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          len: [1, 150],
        },
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          len: [1, 500],
        },
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      previewImage: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isUrl: true },
      },
    },
    {
      sequelize,
      modelName: "Spot",
    }
  );
  
  return Spot;
};
