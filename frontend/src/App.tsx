import { useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import us from "us-atlas/states-10m.json";

import {
  criteria,
  states,
  type Criterion,
  type StateData,
} from "./data/states";

type Weights = Record<Criterion, number>;

type RankedState = StateData & {
  score: number;
};

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
  temperature: 0,
  humidity: 0,
  mountains: 0,
  density: 0,
  jobs: 0,
  coast: 0,
  politics: 0,
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

function getColor(score: number, hasPreferences: boolean) {
  if (!hasPreferences) return "#dbe3ef";

  if (score >= 85) return "#15803d";
  if (score >= 75) return "#22c55e";
  if (score >= 65) return "#84cc16";
  if (score >= 55) return "#eab308";
  if (score >= 45) return "#f97316";
  if (score >= 35) return "#ef4444";

  return "#991b1b";
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

function getDirectionalMatch(
  stateValue: number,
  preference: number,
): number {
  if (preference === 0) return 100;

  const desiredValue = ((preference + 10) / 20) * 100;
  const distance = Math.abs(stateValue - desiredValue);

  return Math.max(0, 100 - distance);
}

function getCriterionMatch(
  state: StateData,
  criterion: Criterion,
  preference: number,
) {
  if (directionalCriteria.has(criterion)) {
    return Math.round(
      getDirectionalMatch(state[criterion], preference),
    );
  }

  return Math.round(state[criterion]);
}

function StateScorecard({
  state,
  weights,
  rank,
  onClose,
}: {
  state: RankedState;
  weights: Weights;
  rank: number;
  onClose: () => void;
}) {
  const breakdown = criteria
    .filter((criterion) => (weights[criterion.key] ?? 0) !== 0)
    .map((criterion) => ({
      key: criterion.key,
      label: criterion.label,
      match: getCriterionMatch(
        state,
        criterion.key,
        weights[criterion.key],
      ),
      importance: Math.abs(weights[criterion.key]),
    }))
    .sort(
      (a, b) =>
        b.importance ** 2 - a.importance ** 2 ||
        b.match - a.match,
    );

  return (
    <div className="scorecard-backdrop" onMouseDown={onClose}>
      <aside
        className="scorecard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scorecard-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="scorecard-header">
          <div>
            <p className="section-kicker">STATE SCORECARD</p>
            <h2 id="scorecard-title">{state.name}</h2>
          </div>

          <button
            type="button"
            className="scorecard-close"
            onClick={onClose}
            aria-label="Close state scorecard"
          >
            ×
          </button>
        </div>

        <div className="scorecard-summary">
          <div>
            <span>Overall match</span>
            <strong>{state.score}%</strong>
          </div>

          <div>
            <span>Overall rank</span>
            <strong>#{rank}</strong>
          </div>
        </div>

        <div className="scorecard-breakdown">
          <div className="scorecard-section-heading">
            <h3>Your match breakdown</h3>
            <span>Selected priorities</span>
          </div>

          {breakdown.map((item) => (
            <div className="breakdown-row" key={item.key}>
              <div className="breakdown-label">
                <span>{item.label}</span>
                <strong>{item.match}%</strong>
              </div>

              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{ width: `${item.match}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="scorecard-note">
          Breakdown only includes preferences you selected.
          Stronger preferences have more influence on the overall score.
        </p>
      </aside>
    </div>
  );
}

export default function App() {
  const [weights, setWeights] = useState<Weights>(initialWeights);
  const [hoveredState, setHoveredState] = useState<string | null>(
    null,
  );
  const [selectedStateName, setSelectedStateName] = useState<
    string | null
  >(null);

  const hasPreferences = Object.values(weights).some(
    (value) => value !== 0,
  );

  const rankedStates = useMemo<RankedState[]>(() => {
    const totalWeight = criteria.reduce((total, criterion) => {
      const value = weights[criterion.key] ?? 0;
      return total + Math.abs(value) ** 2;
    }, 0);

    return states
      .map((state) => {
        if (totalWeight === 0) {
          return {
            ...state,
            score: 0,
          };
        }

        const weightedTotal = criteria.reduce(
          (total, criterion) => {
            const key = criterion.key;
            const preference = weights[key] ?? 0;
            const stateValue = state[key];

            if (directionalCriteria.has(key)) {
              const importance = Math.abs(preference) ** 2;

              if (importance === 0) return total;

              const match = getDirectionalMatch(
                stateValue,
                preference,
              );

              return total + match * importance;
            }

            const importance = preference ** 2;

            return total + stateValue * importance;
          },
          0,
        );

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

  const stateByName = useMemo(
    () =>
      new Map(
        rankedStates.map((state) => [state.name, state]),
      ),
    [rankedStates],
  );

  const rankByState = useMemo(
    () =>
      new Map(
        rankedStates.map((state, index) => [
          state.name,
          index + 1,
        ]),
      ),
    [rankedStates],
  );

  const worstStates = useMemo(
    () => [...rankedStates].reverse().slice(0, 5),
    [rankedStates],
  );

  const selectedState = selectedStateName
    ? stateByName.get(selectedStateName) ?? null
    : null;

  function updateWeight(
    criterion: Criterion,
    value: number,
  ) {
    setWeights((current) => ({
      ...current,
      [criterion]: value,
    }));
  }

  function resetWeights() {
    setWeights(initialWeights);
    setSelectedStateName(null);
  }

  function openState(name: string) {
    if (!hasPreferences) return;
    setSelectedStateName(name);
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">STATE FINDER</p>
          <h1>Where Should We Live?</h1>
          <p className="subtitle">
            Set your priorities. Find the states that fit your life.
          </p>
        </div>

        <button
          type="button"
          className="reset-button"
          onClick={resetWeights}
          disabled={!hasPreferences}
        >
          Reset preferences
        </button>
      </header>

      <div className="dashboard">
        <section className="panel preferences">
          <div className="section-heading">
            <div>
              <p className="section-kicker">PREFERENCES</p>
              <h2>What matters to you?</h2>
            </div>
          </div>

          <div className="sliders">
            {criteria.map((criterion) => {
              const isDirectional =
                directionalCriteria.has(criterion.key);

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

                      <strong
                        className={
                          value !== 0 ? "active-value" : ""
                        }
                      >
                        {value === 0 ? "Any" : Math.abs(value)}
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
                      aria-label={criterion.label}
                    />

                    <div className="direction-labels">
                      <span>{leftLabel}</span>
                      <span>Any</span>
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

                    <strong
                      className={
                        value !== 0 ? "active-value" : ""
                      }
                    >
                      {value}
                    </strong>
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
          <div className="map-header">
            <div>
              <p className="section-kicker">YOUR MATCHES</p>
              <h2>
                {hasPreferences
                  ? "Best states for you"
                  : "Start with your priorities"}
              </h2>
            </div>

            <span className="map-hint">
              {hasPreferences
                ? "Click a state for details"
                : "Move a slider to begin"}
            </span>
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

                if (!path) return null;

                return (
                  <path
                    key={name}
                    d={path}
                    fill={getColor(score, hasPreferences)}
                    className={`state ${
                      selectedStateName === name
                        ? "state-selected"
                        : ""
                    }`}
                    onMouseEnter={() =>
                      setHoveredState(name)
                    }
                    onMouseLeave={() =>
                      setHoveredState(null)
                    }
                    onClick={() => openState(name)}
                  />
                );
              })}
            </svg>

            {hoveredState && (
              <div className="map-tooltip">
                <strong>{hoveredState}</strong>

                <span>
                  {hasPreferences
                    ? `${
                        scoreByState.get(hoveredState) ?? 0
                      }% match · Click for details`
                    : "Set preferences to score"}
                </span>
              </div>
            )}
          </div>

          <div className="legend">
            {hasPreferences ? (
              <>
                <span>Lower match</span>
                <div className="legend-gradient" />
                <span>Higher match</span>
              </>
            ) : (
              <span>
                Your map will update as you choose what matters.
              </span>
            )}
          </div>
        </section>

        <section className="panel rankings">
          <div className="ranking-section">
            <div className="ranking-heading">
              <div>
                <p className="section-kicker">BEST FIT</p>
                <h2>Top states</h2>
              </div>

              <span>Match</span>
            </div>

            {!hasPreferences ? (
              <p className="empty-ranking">
                Choose at least one preference to rank the states.
              </p>
            ) : (
              <div className="ranking-list">
                {rankedStates
                  .slice(0, 5)
                  .map((state, index) => (
                    <button
                      type="button"
                      className="ranking-row"
                      key={state.name}
                      onClick={() => openState(state.name)}
                    >
                      <span className="rank">
                        {index + 1}
                      </span>

                      <span className="ranking-state">
                        <strong>{state.name}</strong>

                        <span className="score-bar">
                          <span
                            className="score-fill"
                            style={{
                              width: `${state.score}%`,
                            }}
                          />
                        </span>
                      </span>

                      <strong className="score">
                        {state.score}%
                      </strong>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="ranking-divider" />

          <div className="ranking-section">
            <div className="ranking-heading">
              <div>
                <p className="section-kicker">WORST FIT</p>
                <h2>Lowest states</h2>
              </div>

              <span>Match</span>
            </div>

            {!hasPreferences ? (
              <p className="empty-ranking">
                Your lowest matches will appear here.
              </p>
            ) : (
              <div className="ranking-list">
                {worstStates.map((state, index) => (
                  <button
                    type="button"
                    className="ranking-row"
                    key={state.name}
                    onClick={() => openState(state.name)}
                  >
                    <span className="rank">
                      {index + 1}
                    </span>

                    <span className="ranking-state">
                      <strong>{state.name}</strong>

                      <span className="score-bar">
                        <span
                          className="score-fill"
                          style={{
                            width: `${state.score}%`,
                          }}
                        />
                      </span>
                    </span>

                    <strong className="score">
                      {state.score}%
                    </strong>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedState && (
        <StateScorecard
          state={selectedState}
          weights={weights}
          rank={
            rankByState.get(selectedState.name) ?? 0
          }
          onClose={() => setSelectedStateName(null)}
        />
      )}
    </main>
  );
}