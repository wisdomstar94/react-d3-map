"use client"
import { ID3Map } from "./d3-map.interface";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from './d3-map.module.css';
import { ZoomBehavior, geoIdentity, geoPath, select, zoom } from "d3";
import axios from 'axios';

export function D3Map<P, J extends string>(props: ID3Map.ComponentProps<P, J>) {
  const {
    apis,
    height,
    currentMap,
    colorSet,
    tooltipContentComponent,
    onFeaturesChange,
  } = props;

  const [width, setWidth] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  const isApiFetchingRef = useRef<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<any, unknown>>();
  const zoomHandleFnRef = useRef<(e: any) => void>();
  const onPolygonMouseOverRef = useRef<(e: any) => void>();
  const onPolygonMouseOutRef = useRef<(e: any) => void>();
  const onPolygonMouseMoveRef = useRef<(e: any) => void>();

  const [apiData, setApiData] = useState<Map<J, ID3Map.GeoJson<P>>>(new Map());

  const drawCountRef = useRef<number>(0);
  
  const isZoomEnable = useMemo(() => props.isZoomEnable ?? false, [props.isZoomEnable]);
  const isAlwaysFitSizeMap = useMemo(() => props.isAlwaysFitSizeMap ?? true, [props.isAlwaysFitSizeMap]);
  
  const polygonDefaultColor = useMemo(() => props.polygonDefaultColor ?? '#fff', [props.polygonDefaultColor]);
  const polygonColorChangeDuration = useMemo(() => props.polygonColorChangeDuration ?? 250, [props.polygonColorChangeDuration]);
  const polygonStrokeWidth = useMemo(() => props.polygonStrokeWidth ?? 0.25, [props.polygonStrokeWidth]);
  const polygonStrokeColor = useMemo(() => props.polygonStrokeColor ?? '#aaa', [props.polygonStrokeColor]);

  function isGeoJsonData(value: any): value is ID3Map.GeoJson<P> {
    if (value === undefined || value === null) return false;
    if (value.features === undefined) return false;
    return true;
  }

  function isEqualString(str1: string | undefined | null, str2: string | undefined | null) {
    if (str1 === undefined || str1 === null) return false;
    if (str2 === undefined || str2 === null) return false;
    return str1 === str2;
  }

  const features = useMemo<ID3Map.Feature<P>[] | undefined>(() => {
    return apiData.get(currentMap)?.features;
  }, [apiData, currentMap]);

  const geoJsonData = useMemo<ID3Map.GeoJson<P> | undefined>(() => {
    return apiData.get(currentMap);
  }, [apiData, currentMap]);

  const onPolygonMouseOver = useCallback((event: any) => {
    const element = event.srcElement as HTMLElement;
    const properties = element.getAttribute('properties');
    const propertiesJson = JSON.parse(properties ?? '{}') as P;

    const lastElement = element.parentElement?.lastElementChild as HTMLElement;
    lastElement.insertAdjacentElement('afterend', element);

    select(element)
      .transition()
      .duration(polygonColorChangeDuration)
      .attr('stroke-width', polygonStrokeWidth)
      .attr('stroke', '#111')
    ;
    
    tooltipRef.current?.classList.add(styles['display']);
    select(tooltipRef.current)
      .transition()
      .duration(250)
      .style('opacity', 1)
    ;

    if (typeof props.onPolygonMouseOver === 'function') {
      props.onPolygonMouseOver(event, {
        properties: propertiesJson,
      });
    }
  }, [polygonColorChangeDuration, polygonStrokeWidth, props]);

  const onPolygonMouseOut = useCallback((event: any) => {
    const element = event.srcElement;
    const properties = element.getAttribute('properties');
    const propertiesJson = JSON.parse(properties ?? {}) as P;

    select(element)
      .transition()
      .duration(polygonColorChangeDuration)
      .attr('stroke-width', polygonStrokeWidth)
      .attr('stroke', polygonStrokeColor)
    ;

    if (tooltipRef.current !== null) {
      select(tooltipRef.current)
        .transition()
        // .delay(100)
        .duration(polygonColorChangeDuration)
        .style('opacity', 0)
        .on('end', () => {
          tooltipRef.current?.classList.remove(styles['display']);
        })
      ;
    }

    if (typeof props.onPolygonMouseOut === 'function') {
      props.onPolygonMouseOut(event, {
        properties: propertiesJson
      });
    }
  }, [polygonColorChangeDuration, polygonStrokeColor, polygonStrokeWidth, props]);

  const convertPropertiesToOutputParams = useCallback((properties: P): ID3Map.OutputParams<P> => {
    return {
      properties,
    };
  }, []);
  
  const onPolygonMouseMove = useCallback((event: any) => {
    const element = event.srcElement;
    const properties = element.getAttribute('properties');
    const propertiesJson = JSON.parse(properties ?? {}) as P;

    select(tooltipRef.current)
      // .transition()
      // .duration(10)
      // .transition()
      // .duration(10)
      // .delay(60)
      .style('left', event.x + 20 + 'px')
      .style('top', event.y + 20 + 'px')
    ;

    if (typeof props.onPolygonMouseMove === 'function') {
      props.onPolygonMouseMove(event, convertPropertiesToOutputParams(propertiesJson));
    }
  }, [convertPropertiesToOutputParams, props]);

  const drawMap = useCallback(() => {
    if (geoJsonData === undefined) return;
    drawCountRef.current++;

    if (zoomRef.current === undefined) {
      zoomRef.current = zoom().on('zoom', (e) => { if (zoomHandleFnRef.current !== undefined) zoomHandleFnRef.current(e)})
    }

    const svg = select(mapContainerRef.current)
      .select('svg')
      .attr("width", width)
      .attr("height", height)
    ;
    if (isZoomEnable === true) {
      svg.call(zoomRef.current);
    }

    const projectionIdentity = geoIdentity()
      .reflectY(true)
      .fitSize([width, height], geoJsonData as any)
    ;

    // const projectionMercator = geoIdentity()
    //   .reflectY(true)
    //   .fitSize([width, height], geoJsonData as any)
    //   // .precision(0.1)
    // ;

    const projection = projectionIdentity;

    svg
      .select('g')
      .selectChildren()
      .remove() 
    ;

    const path = svg
      .select('g')
      .selectAll('path') //지역 설정
      .data(geoJsonData.features)
      .enter()
      .append('path')
    ;
    
    path
      .attr('d', geoPath(projection) as any)
      .attr('properties', (d: ID3Map.Feature<P>) => {
        return JSON.stringify(d?.properties ?? {});
      })
      .attr("stroke", polygonStrokeColor)
      .attr("stroke-width", polygonStrokeWidth)
    ;
      
    if (drawCountRef.current <= 1) {
      path
        .attr("fill", polygonDefaultColor)
      ;
    } else {
      path
        .attr('fill', (d) => {
          const data: ID3Map.Feature<P> = d as any;
          const color = colorSet?.items.find(k => isEqualString(k.targetPropertiesValue, (data.properties as any)[k.targetPropertiesKey]))?.color;
          if (typeof color === 'string') return color;
          return polygonDefaultColor;
        })
      ;
    }

    path
      .on('mouseover', (event) => {
        if (onPolygonMouseOverRef.current !== undefined) {
          onPolygonMouseOverRef.current(event);
        }
      })
      .on('mouseout', (event) => {
        if (onPolygonMouseOutRef.current !== undefined) {
          onPolygonMouseOutRef.current(event);
        }
      })
      .on('mousemove', (event) => {
        if (onPolygonMouseMoveRef.current !== undefined) {
          onPolygonMouseMoveRef.current(event);
        }
      })
    ;
  }, [colorSet?.items, geoJsonData, height, isZoomEnable, polygonDefaultColor, polygonStrokeColor, polygonStrokeWidth, width]);

  const onZoom = useCallback((e: any) => {
    select(mapContainerRef.current).select('svg').select('g').attr('transform', e.transform);
  }, []);

  const fetchApis = useCallback((onSuccess?: () => void) => {
    if (isApiFetchingRef.current) return;
    isApiFetchingRef.current = true;
    
    const filterdApis = apis.filter(x => !apiData.has(x.jsonType));
    if (filterdApis.length === 0) return;

    const maxRetryCount = 3;
    const localMap: Map<J, ID3Map.GeoJson<P>> = new Map();
    for (const item of filterdApis) {
      const {
        jsonType,
        url,
      } = item;
      let retryedCount = 0;
      const call = () => {
        retryedCount++;
        axios.get(url, { responseType: 'json' }).then(res => {
          const json = res.data;
          localMap.set(jsonType, json);
          // console.log(`@jsonType: ${jsonType}`, '성공');
          if (localMap.size === filterdApis.length) {
            setApiData(prev => {
              const newMap = new Map(prev);
              Array.from(localMap.entries()).forEach(([key, value]) => {
                newMap.set(key, value);
              });
              return newMap;
            });
            if (typeof onSuccess === 'function') onSuccess();
          }
        }).catch(err => {
          if (retryedCount < maxRetryCount) {
            call();
          }
        });
      };
      call();
    }
  }, [apiData, apis]);

  useEffect(() => {
    // setIsReady(true);
    fetchApis(() => {
      setIsReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { zoomHandleFnRef.current = onZoom }, [onZoom]);
  useEffect(() => { onPolygonMouseOverRef.current = onPolygonMouseOver }, [onPolygonMouseOver]);
  useEffect(() => { onPolygonMouseOutRef.current = onPolygonMouseOut }, [onPolygonMouseOut]);
  useEffect(() => { onPolygonMouseMoveRef.current = onPolygonMouseMove }, [onPolygonMouseMove]);

  useEffect(() => {
    if (isReady === false) return;
    // ready!!
    const onResize = () => {
      setWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize);
    }

    onResize();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onResize);
      }
    };
  }, [isReady]);

  useEffect(() => {
    if (isReady === false) return;
    if (features === undefined) return;
    if (width === 0) return;
    if (isAlwaysFitSizeMap) {
      drawMap();
    } else {
      if (drawCountRef.current <= 1) {
        drawMap();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features, isReady, width]);

  useEffect(() => {
    if (isReady === false) return;
    if (features === undefined) return;
    drawMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features, isReady, currentMap]);

  useEffect(() => {
    if (colorSet === undefined) return;
    select(mapContainerRef.current)
      .select('svg')
      .select('g')
      .selectAll('path')
      .transition()
      .duration(polygonColorChangeDuration)
      .attr('fill', (d) => {
        const data: ID3Map.Feature<P> = d as any;
        const color = colorSet?.items.find(k => isEqualString(k.targetPropertiesValue, (data.properties as any)[k.targetPropertiesKey]))?.color;
        if (typeof color === 'string') return color;
        return polygonDefaultColor;
      })
    ;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorSet]);

  useEffect(() => {
    if (typeof onFeaturesChange === 'function') onFeaturesChange(features, features?.map(x => convertPropertiesToOutputParams(x.properties)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features]);

  return (
    <>
      <div className={styles['container']}>
        <div ref={mapContainerRef} className={styles['map-container']} style={{ height: `${height}px`, }}>
          <svg className={styles['svg']}>
            <g>

            </g>
          </svg>
        </div>

        <div ref={tooltipRef} className={styles['tooltip']}>
          { tooltipContentComponent }
        </div>
      </div>
    </>
  );
}