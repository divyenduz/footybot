import { main } from './index'

module.exports.run = async (event: any, context: any, callback: any) => {
  await main()

  let response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Unleashing Footybot on meetup.',
    }),
  }
  return response
}
