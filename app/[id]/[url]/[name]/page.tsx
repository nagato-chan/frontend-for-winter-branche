import React, { Suspense } from 'react';
import { Audiowide, Poppins } from '@next/font/google';
import { decode } from 'html-entities';
import {
  CardBase,
  Second,
  Third,
  Fourth,
  Sixth,
  First,
  TopRecordData,
  SixthData,
  WordData,
} from './cards';
import langTags from 'language-tags';

import { getData } from './getData';
const audioWide = Audiowide({ weight: '400', subsets: ['latin'] });
const poppins = Poppins({
  weight: ['400', '600', '500', '700'],
  subsets: ['latin'],
});

function Header() {
  return (
    <div className={audioWide.className + ' pl-9 header-bg header-bg-m '}>
      <div className='pt-12 pb-6 flex gap-2'>
        <img src={'/assets/youtube_logo.svg'} />
        <p className='px-1'>Youtube</p>
      </div>
      <h1 className='text-6xl text-gray-900 uppercase pb-6'>2022 Review</h1>
    </div>
  );
}

function TwoCardsGrid(props: React.PropsWithChildren<{}>) {
  return (
    <div className='inline-grid grid-flow-row gap-4 sm:grid-cols-2 items-center sm:justify-start px-3'>
      {props.children}
    </div>
  );
}
function ThreeCardsGrid(props: React.PropsWithChildren<{}>) {
  return (
    <div className='inline-grid grid-flow-row gap-4 sm:grid-cols-3 items-center sm:justify-start px-3'>
      {props.children}
    </div>
  );
}

function Footer() {
  return (
    <div
      className={`${audioWide.className} font-normal m-auto text-3xl text-center self-center`}
    >
      {'See you next year!'}
    </div>
  );
}

export default async function ReviewPage({
  params,
}: {
  params: { id: string; url: string; name: string };
}) {
  const id = params.id;
  const url = decodeURIComponent(params.url);
  const name = params.name;

  const dto = await getData(id);
  if ('error' in dto) return <div>Error Occuried: {dto.error}</div>;
  if (!dto.ready)
    return (
      <div>
        Data Visualization is not yet ready, please wait for a moment then
        refresh your page.
      </div>
    );
  const data = dto.takeout;
  if (!data) return <div>Error: Data is not yet ready.</div>;

  const totalHours =
    data.category_duration_detail.reduce((a, b) => a + b.watchTime_min, 0) / 60;

  const watchTimeMins = data.category_duration_detail;
  const totalDays = data.stat.active_total_day[0];
  const watchTimeMost = watchTimeMins.find(
    (value) =>
      value.watchTime_min ===
      Math.max(
        ...data.category_duration_detail.map((value) => value.watchTime_min)
      )
  )!;

  const categoryNameOfMost = data.category_duration_detail.find(
    (value) => value.categoryName === watchTimeMost.categoryName
  )!;
  const videoRecord: TopRecordData[] = data.top5.map((item) => {
    return { name: decode(item.video_title), counts: item.watch_times };
  });
  const channelsRecord: TopRecordData[] = data.channel.map((item) => {
    return {
      name: decode(item.channelTitle),
      counts: item.watchTimes2,
    };
  });
  const topicRecords: TopRecordData[] = data.topic.map((item) => {
    return {
      name: item.categoryName,
      counts: item.watchTimes1,
    };
  });

  const languagePieData: SixthData[] = Object.entries(
    data.lang.reduce((acc, curr) => {
      const lang = langTags(curr.language);
      let name = lang.language()?.descriptions()[0] ?? 'Others';
      if (name === 'No linguistic content') {
        name = 'Others';
      }
      if (acc[name]) {
        acc[name] += curr.lanCounts;
      } else {
        acc[name] = curr.lanCounts;
      }
      return acc;
    }, {} as Record<string, number>)
  ).map((val) => {
    return {
      name: val[0],
      value: val[1],
    };
  });

  const categoryPieData: SixthData[] = data.category_duration_detail.map(
    (item) => {
      return {
        name: item.categoryName,
        value: item.watchTime_min,
      };
    }
  );
  const durationPieData: SixthData[] = [
    {
      name: '< 1 min',
      value: data.duration.below_one_minute,
    },
    {
      name: '1-5 min',
      value: data.duration.one_to_five,
    },
    {
      name: '5-10 min',
      value: data.duration.five_to_ten,
    },
    {
      name: '> 10 min',
      value: data.duration.above_ten,
    },
  ];
  const heatmapData = Object.entries(data.heatmap);

  function reduceFn(prv: Record<string, number>, curr: string) {
    const words: string[] = curr
      .replace(/\./g, '')
      .replace(/\W/g, ' ')
      .split(/\s/);
    for (const w of words) {
      if (w.length <= 1) continue;
      if (!prv[w]) prv[w] = 0;
      prv[w] += 1;
    }
    return prv;
  }

  const toWordDatas = (records: Record<string, number>) =>
    Object.keys(records).map((word) => ({
      text: word,
      value: records[word],
    }));
  const videoWordsFreqMap = data.wordcloud.videos.reduce(reduceFn, {});
  const videoWords: WordData[] = toWordDatas(videoWordsFreqMap);

  const commentWordsFreqMap = data.wordcloud.comments.reduce(reduceFn, {});
  const commentWords = toWordDatas(commentWordsFreqMap);
  const searchWordsFreqMap = data.wordcloud.searches.reduce(reduceFn, {});
  const searchWords = toWordDatas(searchWordsFreqMap);

  return (
    <Suspense fallback='loading...'>
      <div className={`${poppins.className} bg-gray-100`}>
        <Header />
        <div className='grid gap-4 grid-cols-1 py-4'>
          <TwoCardsGrid>
            <First
              name={name}
              avatar={url}
              search={data.stat.searches[0]}
              likes={data.stat.likes[0]}
              comments={data.stat.comments[0]}
              totalHours={totalHours}
              videoCounts={data.stat.watched[0]}
              timePercents={watchTimeMost.watchTime_min / totalHours}
              favoriteCategory={categoryNameOfMost.categoryName}
              favoriteVideo={data.top5[0].video_title}
              totalDays={totalDays}
            />
          </TwoCardsGrid>
          <TwoCardsGrid>
            <Second
              data={heatmapData}
              videoPerDay={data.stat.video_watched_per_day[0]}
              videos={data.stat.watched[0]}
              yearlyTotal={totalDays}
              hours={totalHours}
              uptimes={data.stat.uptime[0]}
              hoursPerDay={totalHours / data.stat.active_total_day[0]}
            />
          </TwoCardsGrid>
          <ThreeCardsGrid>
            <Third
              words={videoWords}
              name='Video Keyword Cloud'
              color='#FFC01F'
            />
            <Third
              words={commentWords}
              name='Comment Keyword Cloud'
              color='#15ABFF'
            />
            <Third
              words={searchWords}
              name='Search Keyword Cloud'
              color='#968DFF'
            />
          </ThreeCardsGrid>
          <div className='text-sm font-semibold p-3 pt-6'>Your Top Records</div>
          <ThreeCardsGrid>
            <Fourth
              data={videoRecord}
              shadowColor='#FFF2D2'
              color='#FFC01F'
              name='Videos'
            />
            <Fourth
              data={channelsRecord}
              shadowColor='rgba(29, 243, 166, 0.2)'
              color='#1DF3A6'
              name='Channels'
            />
            <Fourth
              data={topicRecords}
              shadowColor='#EAE8FF'
              color='#968DFF'
              name='Topics'
            />
          </ThreeCardsGrid>

          <ThreeCardsGrid>
            <Sixth
              data={languagePieData}
              colorSet={['#1FAEFF', '#FFF61F', '#1DF3A6', '#1DCDF3']}
              name={'Language'}
            />
            <Sixth
              data={categoryPieData}
              colorSet={['#1DF3A6', '#FFF61F', '#FFAEF2', '#1DCDF3']}
              name={'Category'}
            />
            <Sixth
              colorSet={['#4F8BFF', '#FFF61F', '#1DF3A6', '#FFAEF2']}
              name={'Duration'}
              data={durationPieData}
            />
          </ThreeCardsGrid>
          {/* <Seventh /> */}
        </div>
      </div>
      <footer className='flex w-full footer-bg h-32'>
        <Footer />
      </footer>
    </Suspense>
  );
}
