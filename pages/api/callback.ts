import type { NextApiRequest, NextApiResponse } from "next";

import { PrismaClient } from "@prisma/client";
import { sendMail } from "../../src/mail";
import { getAccessToken, getUser } from "../../src/meetup";
import { DEFAULT_GROUPS } from "../../src/constants";
const prisma = new PrismaClient();

export default async function callbackHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { code, state } = req.query;
    if (state) {
      sendMail({ subject: "Meetup OAuth failed 🔥", body: `Status: ${state}` });
      return res.json({ state });
    }

    try {
      await prisma.$connect();

      const { access_token, refresh_token } = await getAccessToken({ code });

      // TODO: Handle the case when we fail to get remote user for whatever reason
      // curl "https://api.meetup.com/2/member/self/?access_token={access_token}"
      const remoteUser = await getUser({ access_token });
      console.log({ remoteUser });

      const groups = await prisma.group.findMany();
      console.log({ groups });

      // Create necessary groups
      // TODO: Fix this ugly hack, default Groups must exist via seeding and other groups should exist via some other workflow
      await Promise.all(
        DEFAULT_GROUPS.map(async (group) => {
          const existingGroup = groups.some(
            (g) => g.id === group.groupId.toString()
          );
          if (!existingGroup) {
            const newGroup = await prisma.group.create({
              data: {
                id: group.groupId,
              },
            });
            console.log(`Created a new group: ${JSON.stringify(newGroup)}`);
          }
        })
      );

      // TODO: If a user have a valid access token already! Don't do this!
      const user = await prisma.user.upsert({
        where: {
          meetup_id: remoteUser.id.toString(),
        },
        create: {
          access_token,
          refresh_token,
          meetup_id: remoteUser.id.toString(),
          Group: {
            connect: DEFAULT_GROUPS.map((group) => {
              return {
                id: group.groupId.toString(),
              };
            }),
          },
        },
        update: {
          access_token,
          refresh_token,
        },
      });
      console.log({ user });

      return res.json(user);
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
  throw new Error("Method not allowed");
}
