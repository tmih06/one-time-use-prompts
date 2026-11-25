## Context

The codebase is already built and running. You are doing a one-time, whole-suite
refactor of its TypeScript tests. The rules assume TypeScript, Vitest and pnpm.
Treat this as a complete refactor of the suite, not a sample cleanup or a first
pass.

Each **test type** has its own rules below: what the type checks, its rules, the
cases it must cover, how its tests are named, and the shape of one. Find the type
of each test in scope, read its rules, and apply every rule in them.

| Test type                                   | Rules                              |
| ------------------------------------------- | ---------------------------------- |
| Database round trips (a repository's tests) | **Database round trips** below     |
| Pure functions                              | **Pure functions** below           |
| Route handlers                              | **Route handlers** below           |
| Services                                    | **Services** below                 |

Web component and browser tests have no type-specific rules here. **Push down**
and the speed table apply to them, and those that stay are left as written.

## Goal

The **scope** is the whole test suite. You are done when all four hold:

1. **Written to the rules.** Every test in scope whose type has rules here follows all of those rules, with its naming and shape.
2. **Every case covered.** Every public method of the code in scope has tests, and every case its type's **Cases** list names has a test of its own, at the fastest level that can prove it. List the cases for each method before you write or move a test, then tick each one off against a named `it`; a case with no test is a gap, whatever else passes.
3. **Every cost within the scale.** Tests, files and the suite are within the budgets of **Speed** when measured, or reported as that section says.
4. **Every test at the fastest level that can prove it.** Each test in scope that isn't a pure-function test has a verdict under **Push down**.

Then `pnpm format`, `pnpm lint` and `pnpm test` pass, and the tests also pass shuffled (`pnpm vitest run --sequence.shuffle <file>` in the test's package) and one at a time.

Work in this order: the baseline from **Speed**, **Push down**, the type's rules and cases, then **Speed**'s fixes. Each test then gets polished only once it has its final level.

## Inputs

This prompt is self-contained: run it from the root of the repository whose whole
test suite is being refactored. There are no placeholders to fill in. Everything
else is discovered from the repository itself.

## Instructions

### 1. Measure the baseline first

Do not change anything yet. Follow **Speed → Measuring** below on a clean
checkout of the base commit, on a quiet machine, before the first refactor.
Record the suite's CPU time, its test count, and each test's and file's cost.
Keep working notes with each push-down verdict, each case coverage checklist,
each measurement and each bug found.

### 2. Push down

Be aggressive: a test stays at a slow level only for what the table below says only that level can prove. The ladder, fastest first, is pure function, service, route handler or web component, browser. For each test in scope that isn't a pure-function test, try the fastest rung first and stop at the first that can prove what the test checks. Write a one-line **verdict** for it in your working notes: _stays_ (what only this level proves), _moves_ (to which level) or _removed_ (the faster test that covers it).

| Level         | Stays at this level                                                 | Moves down                                        |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| Browser       | One journey per critical flow, and what needs a real browser        | Edge cases and logic, to route or component tests |
| Route handler | Each status code once, each outside service's wiring, each follow-up effect | Every further reason for a status          |
| Service       | Each outcome once, and what lands in the fakes                      | Decisions, to pure functions                      |
| Round trip    | SQL behaviour, filter edges and locks                               | Row mapping written in TypeScript                 |
| Web component | Rendering and interaction                                           | Formatting and state logic                        |

**Extract to test.** Pull out a small pure function when the code holds a real decision (a branch, a calculation, a parse) and the function gets a name from the domain. Move the code unchanged, under **Refactoring**, and keep it reachable through its module's real interface: a pass-through or a private helper made public only for a test stays where it is. When a test can only move by changing logic, its verdict is _stays_.

**Remove duplicates.** A test whose every assertion a faster or same-level test already proves is removed, slowest first. Search every test that exercises the code in scope. Change and delete only tests in scope, and report an out-of-scope duplicate with the faster test that covers it.

**Proof.** A test moves or goes only after the proof, one check per thing it asserted:

1. Name the faster test that covers it, writing that test first if it doesn't exist yet.
2. Temporarily break that behaviour in the code, and confirm a remaining test goes red.
3. Revert the break.

With no red test, the verdict is _stays_ until a faster test goes red on that break.

### 3. Apply the rules for each test type

#### Database round trips

A **round trip** checks that a repository stores data faithfully: write an item through the repository under test, read it back through the same repository, and compare the result with the item.

##### Rules

1. **Short.** Build the item, write it, read it back, compare the whole value: two to four lines in the `it`, with every step visible in it.
2. **Plain repository.** A repository puts data in and gets data out, so a round trip tests storage, never behaviour. Filtering, state changes and choosing between cases belong in the service, tested there with fakes. Logic written in the repository's TypeScript, such as row mapping, is extracted into a pure function with its own unit tests, moved unchanged. Logic in SQL stays in the round trips by its filter edges, and is reported when it belongs in the service.

   The one exception is **locking**: a repository may read a row, apply a change and write it under a lock (`SELECT … FOR UPDATE` in a transaction), because the lock is a storage guarantee. Any non-trivial decision made under the lock is a pure function in its own module with its own unit tests; the repository only calls it. Give each guarantee the lock makes one test of its own, named for the guarantee: `"a change sees what is stored"`, `"two claims at once create one order"`.

3. **Whole value.** `expect(await repository.order(item.id)).toEqual(item)`: the read-back equals the item written.
4. **One example per test.** Each item differs from its neighbours in one visible way, and that difference is what the test is about: nullable columns all null against all filled, an empty JSON column against a full one, a value at a type's edge.
5. **Isolated data.** Every test writes items with keys of its own (its own ID, and its own value in every unique or looked-up column, such as a customer's email), so it reads back only what it wrote. A query over many rows gets a range of its own too, such as a time window or a customer no other test writes for. Tests then pass in any order, alone or together, on a database other tests have already written to.
6. **The fake too.** When a repository has an in-memory fake for service tests (the **Services** rules), the same round trips run against both: one list of cases, run once per implementation (`describe.each`). A case the fake fails is a fake to fix, never a case to skip.

##### Cases

For each repository method, a test for each of these that applies:

- **Every shape of a stored item**: nullable columns all filled and all null, an empty and a full JSON column, each value of an enum column a later query or lock reads.
- **Every way to read it back**: by each key the repository looks items up by.
- **A missing item**: an unknown key read back as `null` or an empty list.
- **Every edge of a query's filter**: one item just inside each bound, one just outside, and one exactly on it; one item per condition the filter rejects on.
- **Every guarantee a lock makes**: the change sees what is stored, the change is written, a change that returns nothing writes nothing, and two changes at once apply one after the other.

##### Speed

**Budget: 50 ms per test.** The usual causes:

- **Migrations run per file or per test.** Run them once in `globalSetup`, save the database with PGlite's `dumpDataDir()`, and start each file from it with `new PGlite({ loadDataDir })`.
- **Many writes** where one proves the point.
- **Sleeps in lock tests.** Make the second change wait on the first with a promise or a barrier.

##### Naming

- The outer `describe` is the class: `describe("OrderRepository")`.
- A nested `describe` names the round trip and its subject: `describe("order round trip")`. One per entity, or one per method when methods store different things.
- Each `it` names the example item in a few words: `"a new order"`, `"a paid order with every item"`, `"an order with every optional field empty"`.

Read only the `describe` and `it` lines: they should tell you what is covered, and why each example differs from the others.

##### Shape

```ts
describe("OrderRepository", () => {
  describe("order round trip", () => {
    it("a new order", async () => {
      await repository.save(NEW_ORDER);
      expect(await repository.order(NEW_ORDER.id)).toEqual(NEW_ORDER);
    });

    it("a paid order with every item", async () => {
      await repository.save(PAID_ORDER);
      expect(await repository.order(PAID_ORDER.id)).toEqual(PAID_ORDER);
    });
  });
});
```

`NEW_ORDER` and `PAID_ORDER` carry different IDs and customers, so neither test can read the other's order. The database is real Postgres with the app's own migrations, migrated once per run into a snapshot, started from that snapshot once per file, and shared by the file's tests; Postgres in the test's own process (PGlite) needs nothing else running.

#### Pure functions

A **pure function** computes its output from its input alone: no I/O, no clock, no randomness, no state it changes. Its test is a table of examples: this input gives that output.

##### Rules

1. **Pure first.** Most of the implementation lives in pure functions, at every layer: domain logic, and the helpers of services, repositories, route handlers and UI. Wherever a pure function can do the job, write one. Classes, I/O and framework code stay thin: they gather the input, call the pure function, and act on its output. Pass what would make a function impure (the time, an ID) in as an argument.
2. **Input, call, output.** Each test builds the input, calls the function once, and compares the whole output: `expect(fn(input)).toEqual(output)`. Both the input and the expected output are written out in the test, as literal values.
3. **One example per test.** Each example differs from its neighbours in one visible way, and that difference is what the test is about.
4. **Tested directly.** Each pure function is tested by calling it, in its own module's test file, not only through the class that calls it.

##### Cases

For each non-trivial pure function, a test for each of these that applies:

- **Every branch**: one example per path through the function.
- **Every edge of a bound**: one example just inside, one just outside, one exactly on it.
- **Empty and full input**: an empty string, list or object, and one with every optional field set.
- **Values at a type's edge**: zero, a negative number, the longest allowed string, characters outside ASCII.

A trivial function (a one-line rename, getter or pass-through) needs no test of its own.

##### Speed

**Budget: 5 ms per test.** A pure function has nothing to wait for, so one over budget has hidden I/O or a very large input: find out which.

##### Naming

- The outer `describe` is the function: `describe("slugOf")`. A module of several functions gets a nested `describe` per function.
- Each `it` names the example input in a few words: `"a plain title"`, `"a title that ends in punctuation"`.

##### Shape

```ts
describe("slugOf", () => {
  it("a plain title", () => {
    const title = "Show mileage as a chart";
    expect(slugOf(title)).toEqual("show-mileage-as-a-chart");
  });

  it("a title that ends in punctuation", () => {
    const title = "Fix: plates!";
    expect(slugOf(title)).toEqual("fix-plates");
  });
});
```

#### Route handlers

A **route test** is a black-box, end-to-end test. It starts the whole app as it runs in production (the framework serving the route handlers, with the real config, services and repositories, on a real database with the app's migrations) and replaces only the outside world: each service the app calls is a **fake**, a small HTTP server in the test's own process. The test then sees the app as a caller and the outside world do: a request goes in over HTTP, and the test checks the answer, and what each fake received.

The handler stays thin: what it parses or checks is a pure function tested by the **Pure functions** rules, so its route tests cover each outcome once, not each case.

##### Rules

1. **Whole app, nothing mocked.** Start the app once per file in `beforeAll`, and close it in `afterAll`. The app reaches each outside service through a URL in its env, so the harness points those at the fakes, as an environment would. A fake implements the endpoints the app calls, with the real API's auth, and keeps what it receives in memory for the test to read. Add an endpoint to a fake when the app starts calling it.
2. **Black box.** A test touches the app only over HTTP. It never reads or writes the app's database or imports its modules. An effect the app keeps to itself shows through a **follow-up request**: the order now reads as paid, or the token just used now gets a 403.
3. **The request in the test.** Write the `fetch` out in the `it`, with its method, path, headers and body, so the test reads as the request it sends. Helpers only arrange: put data in a fake, or bring the app to a state through its own routes (`placeOrder`).
4. **Arrange through the front door.** Reach every state the way production does: through the app's routes, and through what the fakes hold or send (a webhook the fake signs). For time passing, move the clock: the app runs in the test's process and reads its `Date`, so `vi.useFakeTimers({ toFake: ["Date"] })` and `vi.setSystemTime(...)` move only the clock, while timers, sockets and the database run on.
5. **Isolated data.** Every test works on records of its own (a customer, an order, an ID no other test uses), and reads back only those from the fakes. A route that answers about everything, such as a batch job, gets a check that its own record is among the answers (`toContain`).
6. **One environment per file.** The app reads its env once, so a case that needs a setting unset, such as a secret not configured yet, gets a file of its own, with the app started without it.
7. **One example per test.** One request under test per `it`, which differs from its neighbours' in one visible way, and that difference is what the test is about. Follow-up requests only observe.

Work the handler leaves for after its answer runs after the response: wait for its effect on a fake with `vi.waitFor`. Where it should do nothing, prove that the work after the answer has finished, by a signal the app already gives or a follow-up request, then check that no fake received anything.

##### Cases

For each route, a test for each of these that applies:

- **Every status code** the handler answers with, once. Each further reason for a status is tested where it is decided: a missing and a wrong token are two pure-function or service tests, and one 401 here.
- **Every outcome** of the request: what each outside service receives, and what a follow-up request shows, including requests that change nothing.
- **An outside service down** (its fake answering 503), and what the caller gets.
- **Work after the answer**: its effect, and that a request it ignores sends nothing.
- **Time passing**, for a route whose answer depends on it (an expiry, a timeout): one example on each side.
- **Every setting the handler itself reads**, set and unset. A setting passed on to a service or a pure function is tested there.

##### Speed

**Budget: 100 ms per test.** The usual causes:

- **Routes compiled on first request.** Build the app once per run.
- **Fixed sleeps**, in the test or the app.
- **Polling at a slow interval.** Give `vi.waitFor` a short `interval`.
- **Real retry backoff or timeouts in the app.** Make the delay a setting the harness shortens.
- **An outside service with no fake**, waiting on DNS or a connection.
- **Deliberately expensive work**, such as password hashing at production cost.
- **Long arrange chains** through many routes.

##### Naming

- The outer `describe` is the method and path: `describe("POST /api/orders")`; with ", without PAYMENTS_KEY" in a file with a setting unset.
- Each `it` starts with the status, then names the request in a few words: `"201: an order with one item"`, `"401: no bearer token"`, `"409: an order paid twice"`.

Read only the `it` lines: they should list every status the route answers with.

##### Shape

```ts
let app: TestApp;
beforeAll(async () => {
  app = await startApp();
});
afterAll(() => app.close());

describe("POST /api/orders", () => {
  it("201: an order with one item", async () => {
    const customer = addCustomer(app);

    const response = await fetch(`${app.url}/api/orders`, {
      method: "POST",
      headers: { authorization: `Bearer ${customer.token}` },
      body: JSON.stringify({ items: [{ sku: "mug", quantity: 1 }] }),
    });

    expect(response.status).toBe(201);
    const order = await response.json();
    expect(order).toEqual({ id: expect.stringMatching(UUID), total: 1200 });
    expect(app.payments.chargesFor(customer.id)).toEqual([
      { amount: 1200, currency: "gbp" },
    ]);
    const read = await fetch(`${app.url}/api/orders/${order.id}`, {
      headers: { authorization: `Bearer ${customer.token}` },
    });
    expect(await read.json()).toEqual({ ...order, state: "paid" });
  });

  it("401: no bearer token", async () => {
    const response = await fetch(`${app.url}/api/orders`, {
      method: "POST",
      body: JSON.stringify({ items: [{ sku: "mug", quantity: 1 }] }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });
});
```

`startApp` starts the fakes, the database and the app, and points the app's env at them; `addCustomer` puts a customer of the test's own in the fakes.

#### Services

A **service test** builds the service class with a **fake** for each dependency that leaves the process (a repository, a vendor client, the mailer), calls one public method, and checks what came back and what each fake now holds. Everything inside the process runs for real.

The service stays thin: each decision it makes is a pure function tested by the **Pure functions** rules, so its tests cover each outcome once, not each case of a decision.

##### Rules

1. **Real inside, fakes at the edge.** Pure functions and other services run for real, built the same way. Only a dependency that leaves the process gets a fake. Build the service with `new` in a `setup()` function in the test file, never from the app's config or singletons.
2. **One fake per port, typed against it.** A repository's fake is a class that `implements` the repository's interface, lives next to it (`fake-repository.ts`), and keeps its rows in public arrays or maps. A vendor's fake implements the app's own interface for it (`Payments`, `Mailer`), records what it receives, and returns canned answers; never fake a vendor SDK's types. No `vi.mock`, and no `vi.fn` for a constructor dependency. One area's fake is shared by every test file that needs it, never copied.
3. **A fake passes the round trips.** A repository fake does what the repository guarantees and nothing more, including what its locks guarantee, because the service relies on it. The repository's round-trip suite runs against both the repository and its fake (the **Database round trips** rules), so the fake can't drift. A guard in the fake that no round trip covers is untested: add the round trip.
4. **Check state, not calls.** Assert what the method returned, then the state of each fake it changed: a row written, an email sent, a charge created, each compared whole. A call is asserted only for a port that changes the outside world, as the fake's recorded list compared whole. Never assert that a read was or wasn't made, unless the read is itself the requirement (it costs money, it counts against a rate limit); then the fake counts it and the test's name says why.
5. **Time and IDs are arguments.** The service takes the time (`now: () => Date`) and any ID or token source through its constructor. The test fixes both, and writes out the values they produce. No `vi.useFakeTimers` in a service test. Match an ID by its shape only when the code can't take it as an argument.
6. **Arrange through the service, or the fake's rows.** Reach a state by calling the service's own methods (`placedOrder()`), or by putting rows in the fake when no method creates them. Never read or set the service's private fields.
7. **Fresh fakes per test.** `setup()` builds new fakes in every `it`; only constants are shared, so tests pass shuffled and alone.
8. **One example per test.** One call under test per `it`, which differs from its neighbours' in one visible way, and that difference is what the test is about.

##### Cases

For each public method, a test for each of these that applies:

- **Every outcome**: each kind of answer it returns, with the writes and sends that go with it, including a call that changes nothing (an unknown ID, an order no longer pending).
- **Every dependency failing**: each fake that can throw, and what the caller gets, what was left written, and what was logged (spy on `console.error` and assert the error object).
- **Repeats**: the same call twice (a duplicate webhook, a double click), and a call after one that failed halfway.
- **Time passing**, for an answer that depends on it: one example on each side, by setting the injected time. The edges of the bound belong to the pure function that decides it.
- **Every setting it reads**, set and unset.

##### Speed

**Budget: 5 ms per test on fakes or stubs, 50 ms for a test on a real database or subprocess.** Rule 1 stands, so the 50 ms budget is for tests that already exist, each a candidate to move onto fakes. Fresh fakes stay (rule 7), because a fake costs almost nothing. The usual causes:

- **A real database, git or other subprocess** where a fake belongs.
- **Real timers or sleeps.**
- **A heavy `setup()`.**

##### Naming

- The outer `describe` is the class: `describe("OrderService")`; a nested `describe` per method: `describe("placeOrder")`.
- Each `it` names the example in a few words: `"an order with one item"`, `"an unknown customer"`, `"payments down"`.

Read only the `describe` and `it` lines: they should list every method, and every outcome of each.

##### Shape

```ts
const NOW = new Date("2026-10-30T12:00:00Z");
const ORDER_ID = "0f8e2d3c-4b5a-4c6d-8e7f-9a0b1c2d3e4f";

function setup() {
  const orders = new FakeOrderRepository();
  const payments = new FakePayments();
  const service = new OrderService(
    orders,
    payments,
    () => NOW,
    () => ORDER_ID,
  );
  return { service, orders, payments };
}

describe("OrderService", () => {
  describe("placeOrder", () => {
    it("an order with one item", async () => {
      const { service, orders, payments } = setup();

      const result = await service.placeOrder({
        customerId: "customer-1",
        items: [{ sku: "mug", quantity: 1 }],
      });

      expect(result).toEqual({ id: ORDER_ID, total: 1200 });
      expect(orders.rows).toEqual([
        {
          id: ORDER_ID,
          customerId: "customer-1",
          total: 1200,
          state: "pending",
          placedAt: NOW,
        },
      ]);
      expect(payments.charges).toEqual([
        { orderId: ORDER_ID, amount: 1200, currency: "gbp" },
      ]);
    });

    it("payments down", async () => {
      const { service, orders, payments } = setup();
      payments.failNext(new Error("503"));

      await expect(
        service.placeOrder({
          customerId: "customer-1",
          items: [{ sku: "mug", quantity: 1 }],
        }),
      ).rejects.toEqual(new Error("503"));
      expect(orders.rows).toEqual([]);
    });
  });
});
```

`FakeOrderRepository` lives next to `OrderRepository` and passes its round trips; `FakePayments` implements the app's `Payments` interface, and records each charge.

### 4. Assertions

Write one `expect` per thing a test checks, in the order a reader asks about them: what came back, then each effect. Each failure then names the one thing that broke. Compare each thing whole (`toEqual` on the whole value), and keep unrelated values out of a shared array:

```ts
expect(response.status).toBe(201);
expect(await response.json()).toEqual({
  id: expect.stringMatching(UUID),
  total: 1200,
});
expect(payments.charges).toEqual([{ amount: 1200, currency: "gbp" }]);
```

Write out every value the test can know: an error message, a URL built from an ID it has, a time it set. Match a value it can't know (a generated ID, a token, a session URL) by its **shape**: `expect.stringMatching(/^[0-9a-f]{64}$/)` for a 32-byte hex token, a UUID pattern for an ID. A shape fails on an empty string, a wrong format or a value in the wrong field, where `expect.any(String)` passes them all.

### 5. Refactoring

A refactor keeps the code's **semantics**: every caller sees the same answers, errors, writes and calls as before. Within that, change anything: tests and application code alike, interfaces as well as implementations (rename, move, split, merge, extract a pure function, change a signature and every caller with it).

**Split** big files as part of the refactor: above all, move helper functions out of the class or file that uses them into modules grouped by what they are about (an order's state changes in one, the text of its emails in another), each module with its own test file. Each module then has one subject, and its tests read as its list of cases. A split is a round like any other, priced before it is made (see **Speed**), because it multiplies whatever each test pays for.

Work in **rounds**: one change at a time, then `pnpm lint` and `pnpm test`, green before the next round. A test that goes red after a round means the round changed behaviour: undo it and take a smaller step.

A change of behaviour (a bug found, a case handled differently) is outside the refactor: report it, and leave the code as it behaves today, with a test that pins today's behaviour. Next to it, write the test for the right behaviour, red, and skip it (`it.skip`, Vitest's `xit`), named for the bug, so the fix only has to unskip it and delete the pin:

```ts
it("a negative amount (today: £-5)", () => {
  expect(formatPounds(-500)).toEqual("£-5");
});

it.skip("a negative amount (bug: should read -£5)", () => {
  expect(formatPounds(-500)).toEqual("-£5");
});
```

### 6. Speed

One example per test with fresh state multiplies whatever each test's setup costs. One suite grew from 825 tests to 2,200 this way, and its CI run went from 6 minutes to past its 20-minute limit, while elapsed time on a 16-core laptop barely moved. So price the work, and measure it.

#### The scale

A cost belongs at the highest level that can carry it.

| Level    | Paid                               | Budget                                                  | What belongs here                                                                       |
| -------- | ---------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Run**  | Once per `vitest run`              | Seconds are fine                                        | Compiling the app, running migrations once and saving a snapshot, building fixture templates, all in `globalSetup` |
| **File** | Once per test file                 | 100 ms, from the first import to the end of `beforeAll` | Importing the app, starting it, starting its database from the snapshot                 |
| **Test** | Every test, its own setup included | Its type's rules; 100 ms for a test that needs fresh real state (a database or a subprocess of its own) | One request, one round trip, one call                |

Vitest gives each test file a new process by default, so something kept in memory is gone by the next file: the run level hands its results on as files on disk.

**Suite:** the full suite's CPU time (user + system) rises by no more than 25% against the baseline, and fits CI's job limit if the project has one.

#### Measuring

Create a temporary directory outside the repository, referred to as `<tmp>`, and write these two helper scripts into it before measuring.

`<tmp>/speed-reporter.mjs`:

```js
// A Vitest reporter: what each test file and each test costs.
// file_ms runs from the first import to the end of the file's hooks.
// test_ms includes the test's beforeEach and afterEach.
export default class SpeedReporter {
  onTestModuleEnd(testModule) {
    const { setupDuration, collectDuration, duration } = testModule.diagnostic();
    const tests = [...testModule.children.allTests()]
      .filter((test) => test.result().state !== "skipped")
      .map((test) => ({
        name: test.fullName,
        ms: test.diagnostic()?.duration ?? 0,
      }));
    const inTests = tests.reduce((sum, test) => sum + test.ms, 0);
    const fileMs = setupDuration + collectDuration + Math.max(0, duration - inTests);
    console.log(`file_ms ${fileMs.toFixed(1)} ${testModule.relativeModuleId}`);
    for (const test of tests) console.log(`test_ms ${test.ms.toFixed(1)} ${testModule.relativeModuleId} > ${test.name}`);
  }
}
```

`<tmp>/speed-table.mjs`:

```js
#!/usr/bin/env node
// Turns the logs of speed-reporter.mjs into a Markdown table of test time per category.
//
//   node speed-table.mjs --map <map.json> <pass.log> [<rerun.log>...]
//   node speed-table.mjs --map <map.json> --over <pass.log>
//
// The table's times come from the pass. A test found in the reruns is judged
// against its budget by its median there, so one noisy pass can't flag it.
// --over prints the test files to re-run, one per line.
import { readFileSync } from "node:fs";

const NO_VALUE = "—";
const UNCLASSIFIED = "Unclassified";

function parseArguments(argv) {
  const logs = [];
  let mapPath;
  let listOverBudgetFiles = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--map") mapPath = argv[++i];
    else if (argv[i] === "--over") listOverBudgetFiles = true;
    else logs.push(argv[i]);
  }
  if (!mapPath || logs.length === 0) {
    throw new Error("Usage: speed-table.mjs --map <map.json> [--over] <pass.log> [<rerun.log>...]");
  }
  return { mapPath, listOverBudgetFiles, passPath: logs[0], rerunPaths: logs.slice(1) };
}

function parseLog(path) {
  const setupMsByFile = new Map();
  const tests = [];
  const occurrencesOfName = new Map();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const fileLine = line.match(/^file_ms (\S+) (.+)$/);
    const testLine = line.match(/^test_ms (\S+) (.+?) > (.*)$/);
    if (fileLine) {
      setupMsByFile.set(fileLine[2], Number(fileLine[1]));
    } else if (testLine) {
      const name = `${testLine[2]} > ${testLine[3]}`;
      const occurrence = occurrencesOfName.get(name) ?? 0;
      occurrencesOfName.set(name, occurrence + 1);
      tests.push({ id: `${name}#${occurrence}`, file: testLine[2], ms: Number(testLine[1]) });
    }
  }
  return { setupMsByFile, tests };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function medianMsByTest(rerunLogs) {
  const samplesByTest = new Map();
  for (const { tests } of rerunLogs) {
    for (const { id, ms } of tests) samplesByTest.set(id, [...(samplesByTest.get(id) ?? []), ms]);
  }
  return new Map([...samplesByTest].map(([id, samples]) => [id, median(samples)]));
}

function formatDuration(ms) {
  if (ms < 9.95) return `${Number(ms.toFixed(1))} ms`;
  if (ms < 999.5) return `${Math.round(ms)} ms`;
  if (ms < 59_950) return `${(ms / 1000).toFixed(1)} sec`;
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}sec`;
  const totalMinutes = Math.round(totalSeconds / 60);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function formatPercent(part, whole) {
  return whole === 0 ? NO_VALUE : `${((part / whole) * 100).toFixed(1)}%`;
}

function categoryOf(file, map, declaredNames) {
  const category = map.files[file] ?? UNCLASSIFIED;
  if (category !== UNCLASSIFIED && !declaredNames.has(category)) {
    throw new Error(`${file} is mapped to "${category}", which the map's categories don't declare`);
  }
  return category;
}

function emptyRow(name, budgetMs) {
  return { name, budgetMs, totalMs: 0, setupMs: 0, tests: 0, testsMs: 0, overBudget: 0 };
}

function rowsByCategory(pass, map, medians) {
  const declaredNames = new Set(map.categories.map((category) => category.name));
  const rows = new Map(map.categories.map(({ name, budget_ms }) => [name, emptyRow(name, budget_ms)]));
  rows.set(UNCLASSIFIED, emptyRow(UNCLASSIFIED));

  for (const [file, setupMs] of pass.setupMsByFile) {
    const row = rows.get(categoryOf(file, map, declaredNames));
    row.setupMs += setupMs;
    row.totalMs += setupMs;
  }
  for (const test of pass.tests) {
    const row = rows.get(categoryOf(test.file, map, declaredNames));
    row.tests += 1;
    row.testsMs += test.ms;
    row.totalMs += test.ms;
    if (row.budgetMs !== undefined && (medians.get(test.id) ?? test.ms) > row.budgetMs) row.overBudget += 1;
  }
  return [...rows.values()].filter((row) => row.tests > 0 || row.setupMs > 0);
}

function allCategoriesRow(rows) {
  const all = emptyRow("All");
  for (const row of rows) {
    all.totalMs += row.totalMs;
    all.setupMs += row.setupMs;
    all.tests += row.tests;
    all.testsMs += row.testsMs;
    all.overBudget += row.overBudget;
  }
  return all;
}

function tableLine(cells) {
  return `| ${cells.join(" | ")} |`;
}

function rowCells(row, suiteMs, testsWithABudget) {
  const hasBudget = row.budgetMs !== undefined;
  const isAll = row.name === "All";
  return [
    row.name,
    formatDuration(row.totalMs),
    formatDuration(row.setupMs),
    formatPercent(row.totalMs, suiteMs),
    String(row.tests),
    row.tests === 0 ? NO_VALUE : formatDuration(row.testsMs / row.tests),
    hasBudget ? formatDuration(row.budgetMs) : NO_VALUE,
    hasBudget || (isAll && testsWithABudget > 0) ? String(row.overBudget) : NO_VALUE,
    hasBudget ? formatPercent(row.overBudget, row.tests) : isAll ? formatPercent(row.overBudget, testsWithABudget) : NO_VALUE,
  ];
}

function markdownTable(rows) {
  const all = allCategoriesRow(rows);
  const testsWithABudget = rows.reduce((sum, row) => sum + (row.budgetMs === undefined ? 0 : row.tests), 0);
  const header = ["Category", "Total", "Setup", "Time share", "Tests", "Avg per test", "Budget", "Over budget", "% over budget"];
  return [
    tableLine(header),
    tableLine(header.map(() => "---")),
    ...[...rows, all].map((row) => tableLine(rowCells(row, all.totalMs, testsWithABudget))),
  ].join("\n");
}

function filesToRerun(pass, map) {
  const declaredNames = new Set(map.categories.map((category) => category.name));
  const budgetOfCategory = new Map(map.categories.map(({ name, budget_ms }) => [name, budget_ms]));
  const files = new Set();
  for (const test of pass.tests) {
    const budgetMs = budgetOfCategory.get(categoryOf(test.file, map, declaredNames));
    if (budgetMs !== undefined && test.ms > budgetMs) files.add(test.file);
  }
  for (const [file, setupMs] of pass.setupMsByFile) {
    if (map.file_budget_ms !== undefined && setupMs > map.file_budget_ms) files.add(file);
  }
  return [...files];
}

const { mapPath, listOverBudgetFiles, passPath, rerunPaths } = parseArguments(process.argv.slice(2));
const map = JSON.parse(readFileSync(mapPath, "utf8"));
const pass = parseLog(passPath);

if (listOverBudgetFiles) {
  console.log(filesToRerun(pass, map).join("\n"));
} else {
  console.log(markdownTable(rowsByCategory(pass, map, medianMsByTest(rerunPaths.map(parseLog)))));
}
```

- **Baseline first, on a clean checkout of the base commit,** on a quiet machine. Record the suite's CPU time, its test count, and each test's and file's cost. Note the machine's load, and treat a loaded run as rough.
- **Suite:** `/usr/bin/time -p pnpm test`, and add `user` and `sys`. Elapsed time hides extra work on a many-core machine, so the suite's check is CPU time.
- **Tests and files, by category:** one table per package the scope touches, before and after. `<tmp>` is a temporary directory outside the repository.
  1. Write `<tmp>/map.json`, giving each test file one category, for the files of both the before and the after state. Declare a category for each test type present, with its budget from its rules, and for each other kind of test the package has (web components, browser), with no `budget_ms`. `Services (fakes)` and `Services (real)` are separate categories, and a file mixing both takes the real one. A file left out shows as `Unclassified`.
     ```json
     {
       "file_budget_ms": <the File level's budget>,
       "categories": [{ "name": "Pure functions", "budget_ms": <its budget> }, { "name": "Web components" }],
       "files": { "src/slug.test.ts": "Pure functions" }
     }
     ```
  2. In the package, run the whole of it once, one file at a time: `pnpm vitest run --no-file-parallelism --reporter=<tmp>/speed-reporter.mjs > <tmp>/pass.log`.
  3. Re-run three times, to `<tmp>/rerun-1.log` and so on, the same command with the files that `node <tmp>/speed-table.mjs --map <tmp>/map.json --over <tmp>/pass.log` lists. Take the median of each line for anything you report as over budget.
  4. Print the table with `node <tmp>/speed-table.mjs --map <tmp>/map.json <tmp>/pass.log <tmp>/rerun-*.log`.

  **Total** and **Time share** include **Setup**: imports, setup files, `beforeAll` and `afterAll`. **Avg per test** and **Over budget** use each test's own time, `beforeEach` and `afterEach` included. Tests another runner owns, such as Playwright, are named in the report instead.

#### Fixing

- **Price a change before making it.** Before a round that splits tests or gives each example fresh state, multiply the new test count by the setup cost per test. If the result breaks a budget, make the setup cheap first.
- **Find the cause first.** Each cost over budget gets a named cause, confirmed by measuring where its time goes. The type's rules list the usual suspects.
- **Fix in this order:**
  1. Prepare once per run and copy per test: a database snapshot, a template of a fixture. Tests stay isolated and usually don't change.
  2. Replace a real dependency with a fake, where the test's type allows it.
  3. Share expensive real fixtures across a file, only in a file whose tests only read, and say so in the report. This gives up some isolation, so it comes last.
- **Each fix is a round**, measured again afterwards.
- **Warm-up moves into setup.** Whatever only the first test would pay moves to `beforeAll`, because tests also run shuffled and any of them can be first.
- **Speed stays within the rules.** Every test keeps its type's rules, its cases, its assertions and its isolated data. Route tests stay black box against the whole app, framework included. Test timeouts and CI's `timeout-minutes` stay as they are.
- **Slow application code** is in scope when the fix keeps semantics, under **Refactoring**. A fix that would change behaviour is reported.

#### Report

The first two items go in your final summary and in the PR description, the rest in your final summary. On the PR, add them as a `## Test speed` section, or replace that section when it exists: `gh pr edit` on an open PR, and the description itself when you open one.

- The category table of each package, before and after.
- Each test moved or removed, and the test that now covers it.
- Suite CPU time and test count, before and after.
- The slowest ten tests and files, before and after.
- Each test or file still over budget, with its time, its cause and the change that would fix it.
- Duplicates outside the scope, each with the faster test that covers it.
- Slow tests outside the scope or owned by another runner, left as they are.

## Output format

- The refactored test suite and any semantics-preserving application-code
  refactors, landed through the repository's normal change flow (commits or PRs
  matching its conventions).
- A report written to `refactor-tests-report.md` at the repository root listing:
  - the category table of each package, before and after;
  - each test moved or removed, and the test that now covers it;
  - suite CPU time and test count, before and after;
  - the slowest ten tests and files, before and after;
  - each test or file still over budget, with its time, its cause and the change
    that would fix it;
  - duplicates outside the scope, each with the faster test that covers it;
  - slow tests outside the scope or owned by another runner, left as they are;
  - each bug or behavior change found, with the passing pin for today's behavior
    and the skipped red test for the right behavior;
  - confirmation that `pnpm format`, `pnpm lint` and `pnpm test` pass, and that
    the tests also pass shuffled and one at a time.
- If the change lands through a PR, add the first two report items to the PR
  description as a `## Test speed` section, or replace that section when it
  exists.

## Guardrails

- You may modify repository files; rewriting tests and performing
  semantics-preserving refactors are the point.
- Do not change anything until the baseline measurement exists.
- A refactor must keep the code's semantics: every caller sees the same answers,
  errors, writes and calls as before.
- Do not fix a bug or behavior change you find. Report it, pin today's behavior
  with a passing test, and write the right behavior as a skipped red test.
- Do not weaken assertions, coverage, isolation or a test type's rules to make
  the suite faster or easier to refactor.
- Test timeouts and CI's `timeout-minutes` stay as they are.
- Do not stop until every done condition in **Goal** holds, or the exact blocker
  is reported instead of guessed around.
- If the repository does not use TypeScript, Vitest and pnpm, or critical
  information is missing, stop and ask instead of guessing.
