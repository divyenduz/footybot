import * as dotenv from "dotenv";
import open from "open";
import fetch from "node-fetch";
import * as url from "url";

dotenv.config();

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const CONSUMER_REDIRECT_URI = process.env.CONSUMER_REDIRECT_URI;

const MEETUP_API = "https://api.meetup.com";

export function getOAuthURL() {
  return `https://secure.meetup.com/oauth2/authorize?client_id=${CONSUMER_KEY}&response_type=code&redirect_uri=${CONSUMER_REDIRECT_URI}`;
}

export function startOAuth() {
  open(getOAuthURL());
}

export async function getAccessToken({ code }) {
  const params = new url.URLSearchParams();
  params.append("client_id", CONSUMER_KEY);
  params.append("client_secret", CONSUMER_SECRET);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", CONSUMER_REDIRECT_URI);
  params.append("code", code);
  const payload = await fetch("https://secure.meetup.com/oauth2/access", {
    method: "post",
    body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const data = await payload.json();
  const { access_token, refresh_token, token_type, expires_in } = data;
  return { access_token, refresh_token, token_type, expires_in };
}

export async function refreshAccessToken({ refresh_token }) {
  const params = new url.URLSearchParams();
  params.append("client_id", CONSUMER_KEY);
  params.append("client_secret", CONSUMER_SECRET);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refresh_token);
  const payload = await fetch("https://secure.meetup.com/oauth2/access", {
    method: "post",
    body: params,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const data = await payload.json();
  const {
    access_token,
    refresh_token: new_refresh_token,
    token_type,
    expires_in,
  } = data;
  return {
    access_token,
    refresh_token: new_refresh_token,
    token_type,
    expires_in,
  };
}

export async function getUser({ access_token }) {
  const self = await fetch(`${MEETUP_API}/2/member/self`, {
    method: "get",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  let selfData = {};
  try {
    selfData = JSON.parse(await self.text());
  } catch (e) {
    console.log(e);
  }
  //@ts-ignore
  if (selfData.id) {
    return {
      //@ts-ignore
      id: selfData.id,
    };
  } else {
    return null;
  }
}

interface Event {
  id: string;
  rsvp: "yes" | "no" | "waitlist" | "maybe" | "none";
}

export async function getUpcomingEventsWithoutRSVP({
  access_token,
  groupId,
}): Promise<Event[]> {
  const events = await fetch(
    `${MEETUP_API}/2/events?group_id=${groupId}&status=upcoming&rsvp=none`,
    {
      method: "get",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );
  const eventsData = await events.json();

  if (eventsData.results && eventsData.results.length === 0) {
    console.log(`No upcoming events`);
    return [];
  }

  // TODO: This abstraction only works for 1 group. This should be configurable at user level.
  if (eventsData.results && eventsData.results.length >= 1) {
    const PICK = 1;
    console.log(
      `${eventsData.results.length} upcoming events, picking ${PICK}`
    );
    return eventsData.results.slice(0, PICK).map((e) => {
      return {
        id: e.id,
        rsvp: e.rsvp,
      };
    });
  } else {
    console.log(`Error: Failed to get events`);
    return [];
  }
}

export async function performRSVP({ access_token, eventId }) {
  const rsvpParams = new url.URLSearchParams();
  rsvpParams.append("event_id", eventId);
  rsvpParams.append("rsvp", "yes");
  const rsvpPayload = await fetch(`${MEETUP_API}/2/rsvp`, {
    method: "post",
    body: rsvpParams,
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  let rsvpData = {};
  try {
    rsvpData = JSON.parse(await rsvpPayload.text());
  } catch (e) {
    console.log(e);
  }

  //@ts-ignore
  if (rsvpData.problem || rsvpData.response !== "yes") {
    //@ts-ignore
    console.log(rsvpData.problem, { eventId, rsvpData });
    return {
      RSVPId: null,
      eventURL: null,
      //@ts-ignore
      response: rsvpData.response,
      //@ts-ignore
      error: rsvpData.problem,
      //@ts-ignore
      code: rsvpData.code,
    };
  }

  //@ts-ignore
  const RSVPId = rsvpData.rsvp_id;
  //@ts-ignore
  const eventURL = rsvpData.event.event_url;

  return {
    RSVPId,
    eventURL,
    //@ts-ignore
    response: rsvpData.response,
    error: null,
    //@ts-ignore
    code: rsvpData.code,
  };
}
