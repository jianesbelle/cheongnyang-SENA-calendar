import Head from 'next/head'
import Calendar from '../components/Calendar'

export default function Home() {
  return (
    <>
      <Head>
        <title>청량중학교 2026 업무 플래너</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Calendar />
    </>
  )
}
