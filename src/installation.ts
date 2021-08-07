import { DataTypes } from "sequelize";
import { Model, Sequelize } from "sequelize/types";

export const Installation = (sequelize: Sequelize) => {
  const InstallationModel = sequelize.define<
    Model<
      { id: string; installation: string },
      { id: string; installation: string }
    >
  >("Installation", {
    id: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    installation: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });
  InstallationModel.sync();
  return InstallationModel;
};
