import { ExpressReceiver } from "@slack/bolt";
import { Model, ModelCtor } from "sequelize/types";

export const expressReceiverSetup = (InstallationModel: ModelCtor<Model>) =>
  new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: "test",
    scopes: ["im:history", "chat:write"],
    installationStore: {
      storeInstallation: async (installation) => {
        if (
          installation.isEnterpriseInstall &&
          installation.enterprise != null
        ) {
          InstallationModel.upsert({
            id: installation.enterprise.id,
            installation: JSON.stringify(installation),
          });
        } else if (installation.team != null) {
          InstallationModel.upsert({
            id: installation.team.id,
            installation: JSON.stringify(installation),
          });
        }
      },
      fetchInstallation: async (installQuery) => {
        let id;
        if (
          installQuery.isEnterpriseInstall &&
          installQuery.enterpriseId != null
        ) {
          id = installQuery.enterpriseId;
        } else if (installQuery.teamId != null) {
          id = installQuery.teamId;
        }

        if (id != null) {
          return JSON.parse(
            (await InstallationModel.findByPk(id)).getDataValue("installation")
          );
        }
      },
      deleteInstallation: async (installQuery) => {
        if (
          installQuery.isEnterpriseInstall &&
          installQuery.enterpriseId != null
        ) {
          return (
            await InstallationModel.findByPk(installQuery.enterpriseId)
          ).destroy();
        }
        if (installQuery.teamId != null) {
          return (
            await InstallationModel.findByPk(installQuery.teamId)
          ).destroy();
        }
      },
    },
  });
