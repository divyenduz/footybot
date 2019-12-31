import { main, photon } from './index'

module.exports.run = (event: any, context: any, callback: any) => {
  main().finally(() => photon.disconnect())

  let response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Unleashing Footyboy on meetup.',
    }),
  }
  callback(null, response)
}
