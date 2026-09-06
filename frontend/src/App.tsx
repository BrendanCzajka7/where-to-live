import { useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import us from "us-atlas/states-10m.json";

import { criteria, states, type Criterion } from "./data/states";

type Weights = Record<Criterion, number>;

type MapProperties = {
  name: string;
};

type MapFeature = Feature<Geometry, MapProperties>;

const WIDTH = 975;
const HEIGHT = 610;

const directionalCriteria = new Set<Criterion>([
  "temperature",
  "humidity",
  "density",
  "politics",
]);

const initialWeights: Weights = {
  affordability: 0,
  safety: 0,
  nature: 0,

  temperature: 0,   // don't care; -10 cold, +10 hot
  humidity: 0,      // don't care; -10 dry, +10 humid

  mountains: 0,

  density: 0,       // don't care; -10 rural, +10 urban
  jobs: 0,
  coast: 0,

  politics: 0,      // don't care; -10 red, +10 blue

  healthcare: 0,
  schools: 0,
  weatherSeverity: 0,
};

const topology = us as unknown as Topology<{
  states: GeometryCollection<MapProperties>;
  nation: GeometryCollection<MapProperties>;
}>;

const stateFeatures = (
  feature(topology, topology.objects.states) as FeatureCollection<
    Geometry,
    MapProperties
  >
).features;

const projection = geoAlbersUsa()
  .scale(1300)
  .translate([WIDTH / 2, HEIGHT / 2]);

const pathGenerator = geoPath(projection);

function getColor(score: number) {
  if (score >= 85) return "#15803d";
  if (score >= 75) return "#22c55e";
  if (score >= 65) return "#84cc16";
  if (score >= 55) return "#eab308";
  if (score >= 45) return "#f97316";
  if (score >= 35) return "#ef4444";
  return "#27272a";
}

function getDirectionalLabels(criterion: Criterion) {
  switch (criterion) {
    case "temperature":
      return ["Cold", "Hot"];
    case "humidity":
      return ["Dry", "Humid"];
    case "density":
      return ["Rural", "Urban"];
    case "politics":
      return ["Red", "Blue"];
    default:
      return ["", ""];
  }
}

/**
 * Directional state values are stored from 0–100:
 *
 * temperature: 0 = cold, 100 = hot
 * humidity:    0 = dry, 100 = humid
 * density:     0 = rural, 100 = urban
 * politics:    0 = red, 100 = blue
 *
 * User directional sliders run from -10 to +10.
 * We convert that into a desired state value from 0–100 and score
 * based on how close the state is to that preference.
 */
function getDirectionalMatch(
  stateValue: number,
  preference: number,
): number {
  if (preference === 0) {
    return 100;
  }

  const desiredValue = ((preference + 10) / 20) * 100;
  const distance = Math.abs(stateValue - desiredValue);

  return Math.max(0, 100 - distance);
}

export default function App() {
  const [weights, setWeights] = useState<Weights>(initialWeights);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const rankedStates = useMemo(() => {
    const totalWeight = criteria.reduce((total, criterion) => {
      const value = weights[criterion.key] ?? 0;

      if (directionalCriteria.has(criterion.key)) {
        return total + Math.abs(value) ** 2;
      }

      return total + value ** 2;
    }, 0);

    return states
      .map((state) => {
        if (totalWeight === 0) {
          return {
            ...state,
            score: 0,
          };
        }

        const weightedTotal = criteria.reduce((total, criterion) => {
          const key = criterion.key;
          const preference = weights[key] ?? 0;
          const stateValue = state[key];

          if (directionalCriteria.has(key)) {
            const importance = Math.abs(preference) ** 2;

            if (importance === 0) {
              return total;
            }

            const match = getDirectionalMatch(
              stateValue,
              preference,
            );

            return total + match * importance;
          }

          const importance = preference ** 2;

          return total + stateValue * importance;
        }, 0);

        return {
          ...state,
          score: Math.round(weightedTotal / totalWeight),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [weights]);

  const scoreByState = useMemo(
    () =>
      new Map(
        rankedStates.map((state) => [
          state.name,
          state.score,
        ]),
      ),
    [rankedStates],
  );

  function updateWeight(criterion: Criterion, value: number) {
    setWeights((current) => ({
      ...current,
      [criterion]: value,
    }));
  }

  function resetWeights() {
    setWeights(initialWeights);
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">STATE FINDER</p>

          <h1>Where Should We Live?</h1>

          <p className="subtitle">
            Choose what matters to you and see which states fit best.
          </p>
        </div>

        <button
          type="button"
          className="reset-button"
          onClick={resetWeights}
        >
          Reset
        </button>
      </header>

      <div className="dashboard">
        <section className="panel preferences">
          <div className="section-heading">
            <h2>Your priorities</h2>
            <span>Strong preferences matter more</span>
          </div>

          <div className="sliders">
            {criteria.map((criterion) => {
              const isDirectional = directionalCriteria.has(
                criterion.key,
              );

              const value = weights[criterion.key] ?? 0;

              if (isDirectional) {
                const [leftLabel, rightLabel] =
                  getDirectionalLabels(criterion.key);

                return (
                  <div
                    className="slider-row"
                    key={criterion.key}
                  >
                    <div className="slider-label">
                      <span>{criterion.label}</span>

                      <strong>
                        {value === 0
                          ? "Neutral"
                          : Math.abs(value)}
                      </strong>
                    </div>

                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="1"
                      value={value}
                      onChange={(event) =>
                        updateWeight(
                          criterion.key,
                          Number(event.target.value),
                        )
                      }
                    />

                    <div className="direction-labels">
                      <span>{leftLabel}</span>
                      <span>Don't care</span>
                      <span>{rightLabel}</span>
                    </div>
                  </div>
                );
              }

              return (
                <label
                  className="slider-row"
                  key={criterion.key}
                >
                  <div className="slider-label">
                    <span>{criterion.label}</span>
                    <strong>{value}</strong>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={value}
                    onChange={(event) =>
                      updateWeight(
                        criterion.key,
                        Number(event.target.value),
                      )
                    }
                  />

                  <div className="importance-labels">
                    <span>Don't care</span>
                    <span>Essential</span>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <section className="panel map-panel">
          <div className="section-heading">
            <h2>Best matches</h2>
            <span>Hover over a state</span>
          </div>

          <div className="map-wrapper">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="img"
              aria-label="United States compatibility map"
            >
              {stateFeatures.map((state) => {
                const mapState = state as MapFeature;
                const name = mapState.properties.name;
                const score = scoreByState.get(name) ?? 0;
                const path = pathGenerator(mapState);

                if (!path) {
                  return null;
                }

                return (
                  <path
                    key={name}
                    d={path}
                    fill={getColor(score)}
                    className="state"
                    onMouseEnter={() =>
                      setHoveredState(name)
                    }
                    onMouseLeave={() =>
                      setHoveredState(null)
                    }
                  />
                );
              })}
            </svg>

            {hoveredState && (
              <div className="map-tooltip">
                <strong>{hoveredState}</strong>

                <span>
                  {scoreByState.get(hoveredState) ?? 0}% match
                </span>
              </div>
            )}
          </div>

          <div className="legend">
            <span>Lower match</span>
            <div className="legend-gradient" />
            <span>Higher match</span>
          </div>
        </section>

        <section className="panel rankings">
  <div className="section-heading">
    <h2>Top states</h2>
    <span>Overall match</span>
  </div>

  <div className="ranking-list">
    {rankedStates.slice(0, 10).map((state, index) => (
      <div className="ranking-row" key={state.name}>
        <span className="rank">{index + 1}</span>

        <div className="ranking-state">
          <strong>{state.name}</strong>

          <div className="score-bar">
            <div
              className="score-fill"
              style={{ width: `${state.score}%` }}
            />
          </div>
        </div>

        <strong className="score">{state.score}%</strong>
      </div>
    ))}
  </div>

  <div className="worst-heading">
    <h2>Worst states</h2>
    <span>Lowest match</span>
  </div>

  <div className="ranking-list">
    {rankedStates
      .slice(-10)
      .reverse()
      .map((state, index) => (
        <div className="ranking-row" key={state.name}>
          <span className="rank">{index + 1}</span>

          <div className="ranking-state">
            <strong>{state.name}</strong>

            <div className="score-bar">
              <div
                className="score-fill"
                style={{ width: `${state.score}%` }}
              />
            </div>
          </div>

          <strong className="score">{state.score}%</strong>
        </div>
      ))}
  </div>
</section>
      </div>
    </main>
  );
}