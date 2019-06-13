import * as dotenv from "dotenv";
dotenv.config();

import { Photon } from "@generated/photon";

import {
  getUpcomingEventsWithoutRSVP,
  performRSVP,
  confirmRSVP,
  getUser,
  refreshAccessToken
} from "./meetup";
import { sendMail } from "./mail";

const photon = new Photon();

export async function main() {
  //TODO: Add user/group and what not batching later. Re-architect this system for scalability

  const users = await photon.users({
    select: {
      id: true,
      email: true,
      meetup_id: true,
      access_token: true,
      refresh_token: true,
      groups: {
        select: {
          id: true
        }
      }
    }
  });

  // TODO: Make this less nested shit
  // TODO: Collect responses to share back with user about which event was a success and which was a failure
  // TODO: Send 1 email in place of N mails for each success failure
  users.forEach(async user => {
    // Test and if needed, refresh access_token, if refresh fails, notify user to re-login
    const meetupUser = await getUser({
      access_token: user.access_token
    });
    if (!meetupUser) {
      const { access_token, refresh_token } = await refreshAccessToken({
        refresh_token: user.refresh_token
      });

      const updatedUser = await photon.users.update({
        where: {
          id: user.id
        },
        data: {
          access_token,
          refresh_token
        }
      });

      // TODO: Better telemetry
      console.log(`Token for user ${updatedUser.id} refreshed`);
    }

    const groups = user.groups;
    groups.forEach(async group => {
      const events = await getUpcomingEventsWithoutRSVP({
        access_token: user.access_token,
        groupId: group.meetup_id
      });
      if (events.length === 0) {
        console.log(`Group: ${group.meetup_id} has no new events`);
      } else {
        console.log(
          `Group: ${group.meetup_id} has ${events.length} sliced events`
        );
      }
      events.forEach(async event => {
        const { RSVPId, eventURL } = await performRSVP({
          access_token: user.access_token,
          eventId: event.id
        });
        const confirmation = await confirmRSVP({
          access_token: user.access_token,
          RSVPId
        });
        if (confirmation === "yes") {
          sendMail({
            subject: "Meetup event scheduled ✅",
            body: `Meetup event ${eventURL} is scheduled successfully`,
            to: user.email
          });
        } else {
          sendMail({
            subject: "Meetup event scheduling failed ❌",
            body: `Meetup event ${eventURL} is failed to schedule with the following status: ${confirmation}`,
            to: user.email
          });
        }
      });
    });
  });
}

if (require.main === module) {
  main().finally(async () => {
    await photon.disconnect();
  });
}
