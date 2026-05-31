# Mocked Arrivals Foundation

## Goal

Define the first buildable milestone for Public Transport Tracker without depending on a real transport provider.

## Why start with mocked arrivals

- arrivals are the fastest way to make the product feel useful early
- mocked data keeps the first UI milestone small and testable
- the same shapes can later be replaced by a real API with minimal UI churn

## Primary v0 user scenarios

1. A commuter opens the app and checks the next arrivals for a saved stop.
2. A user switches between nearby stops to compare which line arrives first.
3. A user opens a route and sees the ordered stops plus the next expected arrivals.
4. A user quickly spots service disruptions or delays attached to an arrival.

## V0 product slice

The first UI milestone should focus on three connected views:

- stop list with pinned and nearby stops
- arrival board for the selected stop
- route detail panel for the selected line

This keeps the app useful while avoiding trip planning, maps, and real-time subscriptions in the first pass.

## Core entities

### Stop

- id
- name
- code
- area
- lines: string[]
- isFavorite: boolean

### Route

- id
- line
- destination
- color
- stops: RouteStop[]

### RouteStop

- stopId
- stopName
- order

### Arrival

- id
- stopId
- routeId
- line
- destination
- scheduledAt
- expectedAt
- status: on-time | delayed | boarding | cancelled
- platform?: string
- disruptionNote?: string

## Mock data rules

- use one city/area only for v0 to avoid fake geographic complexity
- include 5 to 8 stops, 4 to 6 lines, and enough arrivals to populate multiple states
- include mixed statuses so the UI can represent normal, delayed, and cancelled service
- keep timestamps relative to now when possible so the board feels alive during development
- keep the mock layer static and local first, with one clear module to replace later

## Suggested mock module shape

```ts
export type TransportSnapshot = {
  generatedAt: string;
  stops: Stop[];
  routes: Route[];
  arrivals: Arrival[];
};

export function getTransportSnapshot(): TransportSnapshot;
export function getStopArrivals(stopId: string): Arrival[];
export function getRoute(routeId: string): Route | undefined;
```

## First UI milestone

Build a simple React app shell that supports:

- selecting a stop from a sidebar
- viewing the next arrivals for that stop
- selecting an arrival or route to inspect the route stops
- visually distinguishing on-time, delayed, boarding, and cancelled states

## Explicitly out of scope for this milestone

- live provider integration
- account sync
- trip planning across transfers
- map rendering
- push notifications
- background refresh logic

## Exit criteria

This milestone is complete when a developer can run the app locally and:

- browse mock stops
- inspect a believable arrival board
- open a route detail view
- verify that delay and disruption states are represented in the UI
