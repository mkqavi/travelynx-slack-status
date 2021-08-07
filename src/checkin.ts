import { App, ExpressReceiver, InstallationQuery } from "@slack/bolt";
import { Profile } from "@slack/web-api/dist/response/UsersLookupByEmailResponse";
import { jwtVerify, KeyLike } from "jose/jwt/verify";
import { Hook, isHook } from "./travelynx";

export const checkin = (
  receiver: ExpressReceiver,
  slackApp: App,
  publicKey: KeyLike
) => {
  receiver.router.post("/checkin", async (request, response) => {
    const hook = request.body;
    const jwt = request.headers.authorization.replace(/Bearer /gi, "");
    const { payload } = await jwtVerify(jwt, publicKey);
    const enterprise = payload.enterpriseId != null ? true : false;
    const id: string = enterprise
      ? (payload.enterpriseId as string)
      : (payload.teamId as string);
    const uid: string = payload.userId as string;
    if (!isHook(hook)) {
      response.send("-1");
    }

    const query: InstallationQuery<boolean> = {
      isEnterpriseInstall: enterprise,
      enterpriseId: id,
      teamId: id,
      userId: uid,
    };

    const authRes = await receiver.installer.authorize(query);

    if (authRes.botToken == null || authRes.userToken == null) {
      response.send("-3");
    }

    setUserStatus(slackApp, authRes.userToken, query.userId, hook);

    response.send("OK");
  });
};

const setUserStatus = async (
  slackApp: App,
  userToken: string,
  userId: string,
  hook: Hook
) => {
  const profileChange: Profile = {
    status_emoji: ":train2:",
    status_expiration: hook.status.toStation.realTime,
    status_text: `Traveling to ${hook.status.toStation.name}`,
  };

  let profileRes;
  try {
    profileRes = await slackApp.client.users.profile.set({
      profile: JSON.stringify(profileChange),
      user: userId,
      token: userToken,
    });
  } catch (err) {
    console.log(`Profile ${err}`);
  }

  console.log(profileRes.username);
};
