"use client"
import { D3Map } from "@/components/d3-map/d3-map.component";
import { ID3Map } from "@/components/d3-map/d3-map.interface";
import { useMemo, useState } from "react";
import { schemeRdYlBu } from "d3";

/**
 * 그리실 geo json 의 종류만큼 해당 MapType 을 지정하시면 됩니다.
 */
type MapType = 'korea-sido' | 'korea-emd';

/**
 * geo json 파일마다 이 properties 가 다르기 때문에 이 부분은 적용하실 geo json 파일에 기재된 properties 구조에 맞춰 인터페이스를 작성하시면 됩니다.
 */
interface Properties {
  // ...
  code: string;
  // ...
}

export default function Page() {
  const [currentMap, setCurrentMap] = useState<MapType>('korea-sido');
  const [colorSet, setColorSet] = useState<ID3Map.ColorSet<Properties>>();
  const [currentFeatures, setCurrentFeatures] = useState<ID3Map.Feature<Properties>[]>();
  const [mouseOveredOutputParams, setMouseOveredOutputParams] = useState<ID3Map.OutputParams<Properties>>();
  const tooltipComponent = useMemo(() => {
    return (
      <>
        <div className="w-full relative bg-amber-400 text-amber-950 text-sm whitespace-pre-line break-all">
          { JSON.stringify(mouseOveredOutputParams?.properties) }
        </div>
      </>
    );
  }, [mouseOveredOutputParams]);

  return (
    <>
      <div className="w-full relative">
        <D3Map<Properties, MapType>
          apis={[
            { jsonType: 'korea-sido', url: process.env.NEXT_PUBLIC_KOREA_SIDO_GEO_JSON_URL ?? '' },
            { jsonType: 'korea-emd', url: process.env.NEXT_PUBLIC_KOREA_EMD_GEO_JSON_URL ?? '' },
          ]}
          height={400}
          isZoomEnable={true}
          polygonColorChangeDuration={120}
          currentMap={currentMap}
          tooltipContentComponent={tooltipComponent}
          onPolygonMouseOver={(event, params) => {
            console.log('params.properties', params.properties);
            setMouseOveredOutputParams(params);
          }}
          onFeaturesChange={(features) => {
            setCurrentFeatures(features);
          }}
          colorSet={colorSet}
          />
      </div>
      <div className="w-full relative flex flex-wrap gap-2">
        <button
          className="inline-flex px-6 py-2 border rounded-lg border-slate-500 cursor-pointer hover:bg-slate-200/70 text-sm text-slate-700"
          onClick={() => {
            if (currentMap === 'korea-emd') {
              setCurrentMap('korea-sido');
            } else {
              setCurrentMap('korea-emd');
            }
          }}>
          map 바꾸기
        </button>
        <button
          className="inline-flex px-6 py-2 border rounded-lg border-slate-500 cursor-pointer hover:bg-slate-200/70 text-sm text-slate-700"
          onClick={() => {
            setColorSet({
              items: currentFeatures?.map(k => {
                return {
                  color: schemeRdYlBu[11][getRandomInteger(0, 10)],
                  targetPropertiesKey: 'code',
                  targetPropertiesValue: k.properties['code'],
                };
              }) ?? [],
            })
          }}>
          color set 바꾸기
        </button>
      </div>
    </>
  );
}

function getRandomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}