import React from 'react';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

import { ProECharts } from '@gjxwxt/react-components/charts';
import { useAppContext } from '../../../app/providers';

type TrendRangeKey = 'day' | 'hour' | 'month' | 'week';
type TrendKind = 'cpu' | 'memory' | 'network';

type UsageCard = {
  accentClassName: string;
  percentage: number;
  title: string;
  total: string;
  used: string;
};

type TrendOption = React.ComponentProps<typeof ProECharts>['option'];

const rangeOrder: TrendRangeKey[] = ['hour', 'day', 'week', 'month'];

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((part) => `${part}${part}`)
          .join('')
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const createTrendOption = (values: number[], color: string): TrendOption => {
  return {
    animation: false,
    grid: {
      left: 0,
      right: 0,
      top: 10,
      bottom: 0,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
      },
    },
    xAxis: {
      type: 'category',
      show: false,
      boundaryGap: false,
      data: values.map((_, index) => String(index)),
    },
    yAxis: {
      type: 'value',
      show: false,
      splitLine: { show: false },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: values,
        lineStyle: {
          width: 5,
          color,
        },
        areaStyle: {
          color: hexToRgba(color, 0.14),
        },
        emphasis: {
          disabled: true,
        },
      },
    ],
  };
};

const CircularMeter: React.FC<{
  accentColor: string;
  percentage: number;
  size?: number;
}> = ({ accentColor, percentage, size = 70 }) => {
  return (
    <div
      className="dashboard-circular-meter"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${accentColor} 0 ${percentage}%, #e8e8e8 ${percentage}% 100%)`,
      }}
    >
      <div className="dashboard-circular-meter__inner" />
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { t } = useAppContext();
  const [ranges, setRanges] = React.useState<Record<TrendKind, TrendRangeKey>>({
    cpu: 'hour',
    memory: 'hour',
    network: 'hour',
  });

  const rangeLabels: Record<TrendRangeKey, string> = {
    hour: t.dashboard.rangeHour,
    day: t.dashboard.rangeDay,
    week: t.dashboard.rangeWeek,
    month: t.dashboard.rangeMonth,
  };

  const usageCards: UsageCard[] = [
    {
      title: t.dashboard.cpuUsage,
      percentage: 46.3,
      used: '86.84',
      total: '187.50',
      accentClassName: 'is-blue',
    },
    {
      title: t.dashboard.memoryUsage,
      percentage: 15.3,
      used: '115.54 GB',
      total: '753.81',
      accentClassName: 'is-green',
    },
    {
      title: t.dashboard.storageUsage,
      percentage: 51.6,
      used: '207.30 GB',
      total: '401.77',
      accentClassName: 'is-cyan',
    },
  ];

  const appStats = [
    {
      className: 'is-success',
      label: t.dashboard.running,
      value: '29',
      percentage: '90.63%',
      icon: <CheckCircleFilled />,
    },
    {
      className: 'is-neutral',
      label: t.dashboard.stopped,
      value: '0',
      percentage: '0.0%',
      icon: <img src="/svg/stopIcon.svg" alt="" />,
    },
    {
      className: 'is-info',
      label: t.dashboard.creating,
      value: '0',
      percentage: '0.0%',
      icon: <img src="/svg/loadingIcon.svg" alt="" />,
    },
    {
      className: 'is-warning',
      label: t.dashboard.warning,
      value: '3',
      percentage: '9.37%',
      icon: <img src="/svg/Iconwarning.svg" alt="" />,
    },
    {
      className: 'is-danger',
      label: t.dashboard.failed,
      value: '0',
      percentage: '0.0%',
      icon: <CloseCircleFilled />,
    },
  ];

  const distributionRows = [
    { host: '192.168.70.19', value: 34 },
    { host: '192.168.70.17', value: 29 },
    { host: '192.168.70.18', value: 25 },
    { host: '192.168.70.21', value: 18 },
    { host: '192.168.70.23', value: 12 },
  ];
  const distributionMax = Math.max(...distributionRows.map((row) => row.value), 1);

  const trendValues: Record<TrendKind, Record<TrendRangeKey, number[]>> = {
    cpu: {
      hour: [2.5, 2.7, 2.9, 3.2, 2.8, 3.1, 3.3, 3.6, 3.1, 3.4, 3.8, 3.6],
      day: [2.2, 2.8, 3.4, 3.1, 2.9, 3.8, 4.1, 3.6, 3.2, 3.4, 3.7, 3.5],
      week: [2.1, 2.4, 2.8, 3.3, 3.7, 3.2, 2.9, 3.1, 3.8, 4.0, 3.6, 3.2],
      month: [2.4, 2.2, 2.6, 3.1, 3.5, 3.8, 3.2, 3.6, 3.9, 3.4, 3.0, 3.3],
    },
    memory: {
      hour: [1.8, 2.0, 2.2, 2.4, 2.3, 2.6, 2.5, 2.8, 2.7, 2.9, 2.7, 2.6],
      day: [1.6, 1.9, 2.2, 2.0, 2.3, 2.6, 2.8, 2.5, 2.4, 2.7, 2.9, 2.8],
      week: [1.7, 1.8, 2.1, 2.4, 2.7, 2.5, 2.2, 2.6, 2.8, 2.6, 2.3, 2.1],
      month: [1.5, 1.8, 2.0, 2.3, 2.5, 2.7, 2.4, 2.2, 2.5, 2.8, 2.9, 2.6],
    },
    network: {
      hour: [35, 42, 38, 51, 49, 56, 62, 58, 60, 67, 63, 59],
      day: [28, 34, 39, 45, 48, 55, 53, 50, 57, 61, 58, 54],
      week: [24, 31, 36, 42, 39, 44, 49, 53, 56, 51, 47, 43],
      month: [26, 33, 37, 41, 46, 52, 57, 61, 58, 55, 51, 48],
    },
  };

  const trendCards: Array<{
    accentColor: string;
    key: TrendKind;
    title: string;
  }> = [
    { key: 'cpu', title: t.dashboard.cpuTrend, accentColor: '#1890ff' },
    { key: 'memory', title: t.dashboard.memoryTrend, accentColor: '#0d7c3e' },
    { key: 'network', title: t.dashboard.networkTrend, accentColor: '#00b8d9' },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__top-row">
        {usageCards.map((item) => (
          <section
            key={item.title}
            className={`dashboard-white-card dashboard-usage-card ${item.accentClassName}`}
          >
            <div className="dashboard-usage-card__top">
              <span className="dashboard-usage-card__title">{item.title}</span>
              <CircularMeter
                accentColor={
                  item.accentClassName === 'is-blue'
                    ? '#0052d9'
                    : item.accentClassName === 'is-green'
                      ? '#0d7c3e'
                      : '#00b8d9'
                }
                percentage={item.percentage}
                size={72}
              />
            </div>

            <div className="dashboard-usage-card__percent">{item.percentage}%</div>
            <div className="dashboard-usage-card__detail">
              <div className="dashboard-usage-card__detail-row">
                <span>
                  {t.dashboard.usedPrefix}: {item.used}
                </span>
                <span>
                  {t.dashboard.totalPrefix}: {item.total}
                </span>
              </div>
              <div className="dashboard-usage-card__track">
                <div
                  className="dashboard-usage-card__fill"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="dashboard-page__middle-row">
        <section className="dashboard-white-card">
          <div className="dashboard-card-title">
            <span className="dashboard-card-title__mark" />
            <span className="dashboard-card-title__text">{t.dashboard.appOverview}</span>
          </div>

          <div className="dashboard-app-overview">
            {appStats.map((item) => (
              <div key={item.label} className={`dashboard-app-stat ${item.className}`}>
                <div className="dashboard-app-stat__icon">{item.icon}</div>
                <span className="dashboard-app-stat__label">{item.label}</span>
                <span className="dashboard-app-stat__value">{item.value}</span>
                <span className="dashboard-app-stat__percent">{item.percentage}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-white-card">
          <div className="dashboard-card-title">
            <span className="dashboard-card-title__mark" />
            <span className="dashboard-card-title__text">{t.dashboard.hostDistribution}</span>
          </div>

          <div className="dashboard-distribution">
            {distributionRows.map((row) => (
              <div key={row.host} className="dashboard-distribution__row">
                <div className="dashboard-distribution__labels">
                  <span className="dashboard-distribution__host">{row.host}</span>
                  <span className="dashboard-distribution__value">{row.value}</span>
                </div>
                <div className="dashboard-distribution__track">
                  <div
                    className="dashboard-distribution__fill"
                    style={{ width: `${(row.value / distributionMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-page__trend-row">
        {trendCards.map((card) => (
          <section key={card.key} className="dashboard-white-card dashboard-trend-card">
            <div className="dashboard-trend-card__header">
              <div className="dashboard-card-title dashboard-card-title--compact">
                <span className="dashboard-card-title__mark" />
                <span className="dashboard-card-title__text">{card.title}</span>
              </div>

              <div className="dashboard-range-tabs">
                {rangeOrder.map((rangeKey) => (
                  <button
                    key={rangeKey}
                    type="button"
                    className={`dashboard-range-tabs__item${
                      ranges[card.key] === rangeKey ? ' is-active' : ''
                    }`}
                    onClick={() => {
                      setRanges((current) => ({ ...current, [card.key]: rangeKey }));
                    }}
                  >
                    {rangeLabels[rangeKey]}
                  </button>
                ))}
              </div>
            </div>

            <div className="dashboard-trend-card__chart">
              <ProECharts
                option={createTrendOption(
                  trendValues[card.key][ranges[card.key]],
                  card.accentColor,
                )}
                style={{ width: '100%', height: '100%' }}
                watchResize
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
