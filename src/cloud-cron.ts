import { main } from "./index";

module.exports.run = async (event: any, context: any, callback: any) => {
  main();

  let response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "Unleashing Footyboy on meetup."
    })
  };
  callback(null, response);
};
