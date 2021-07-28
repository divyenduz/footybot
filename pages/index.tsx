interface Props {
  oAuthUrl: string;
}

function HomePage({ oAuthUrl }: Props) {
  return (
    <div>
      <a href={oAuthUrl}>Login with Meetup</a>
    </div>
  );
}

export async function getServerSideProps() {
  const CONSUMER_KEY = process.env.CONSUMER_KEY;
  const CONSUMER_REDIRECT_URI = process.env.CONSUMER_REDIRECT_URI;

  return {
    props: {
      oAuthUrl: `https://secure.meetup.com/oauth2/authorize?client_id=${CONSUMER_KEY}&response_type=code&redirect_uri=${CONSUMER_REDIRECT_URI}`,
    },
  };
}

export default HomePage;
