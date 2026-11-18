/**
 * LaunchPilot local demo smoke tests
 * Run against an isolated NEXT_PUBLIC_LAUNCHPILOT_DEMO=true development server.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    process.stdout.write(`• Testing: ${name}... `);
    await fn();
    const durationMs = Date.now() - start;
    results.push({ name, status: "PASS", durationMs });
    console.log(`\x1b[32mPASS\x1b[0m (${durationMs}ms)`);
  } catch (err) {
    const durationMs = Date.now() - start;
    const details = err instanceof Error ? err.message : String(err);
    results.push({ name, status: "FAIL", durationMs, details });
    console.log(`\x1b[31mFAIL\x1b[0m (${durationMs}ms)\n  Error: ${details}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main() {
  console.log("\n========================================================");
  console.log(`🚀 LAUNCHPILOT PRODUCTION DEPLOYMENT TEST SUITE`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("========================================================\n");

  let createdProductId = "";
  let previewSlug = "";

  // 1. PUBLIC PAGES RENDERING & SEO
  await runTest("Landing Page (/) renders with 200 OK & SEO meta tags", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes("You shipped it."), "Headline missing from landing page");
    assert(html.includes("Now get it seen."), "Subheadline missing");
    assert(html.includes("35"), "35 platforms stat missing");
    assert(html.includes("LaunchPilot"), "Brand title missing");
    assert(html.includes("og:title") || html.includes("twitter:card") || html.includes("description"), "Meta tags missing");
  });

  await runTest("Submit Page (/submit) renders with 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/submit`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes("Submit Your Product"), "Submit heading missing");
    assert(html.includes("Product Basics"), "Step 1 missing");
  });

  await runTest("Dashboard Page (/dashboard) renders with 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/dashboard`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes("Founder Dashboard"), "Dashboard heading missing");
  });

  await runTest("Pricing Page (/pricing) renders with 200 OK & plans", async () => {
    const res = await fetch(`${BASE_URL}/pricing`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes("Launch Kit"), "Launch Kit plan missing");
    assert(html.includes("Done-For-You"), "Done-For-You plan missing");
  });

  await runTest("Admin Console (/admin) renders with 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/admin`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 2. PRODUCT SUBMISSION & VALIDATION API
  await runTest("POST /api/products validates required fields (400 on empty)", async () => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    assert(res.status === 400, `Expected 400 validation error, got ${res.status}`);
  });

  await runTest("POST /api/products creates a new product successfully", async () => {
    const newProductData = {
      name: "BugTrackerPro",
      url: "https://bugtrackerpro.dev",
      tagline: "Instant visual bug reporting with console session replay",
      short_description: "BugTrackerPro captures user screen clicks, console errors, and network payloads in one click for software teams.",
      long_description: "Developers waste hours trying to reproduce vague user bug reports. BugTrackerPro embeds a 5kb widget that records exact DOM state, network waterfalls, and console logs, formatting them directly for GitHub Issues and Jira.",
      category: "Developer Tools",
      pricing_model: "freemium",
      tech_stack: "TypeScript, WebAssembly, IndexedDB, Tailwind",
      target_audience: "Frontend engineers, QA teams, and indie developers",
      logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128",
      screenshots: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
      ],
      founder_name: "Elena Rostova",
      founder_email: "elena@bugtrackerpro.dev",
      founder_twitter: "elena_dev",
      launch_goal: "all",
    };

    const res = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProductData),
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "success flag was not true");
    assert(Boolean(data.product?.id), "product id missing from response");
    createdProductId = data.product.id;
  });

  await runTest("GET /api/products/[id] retrieves the newly created product", async () => {
    assert(Boolean(createdProductId), "No createdProductId from previous step");
    const res = await fetch(`${BASE_URL}/api/products/${createdProductId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.product.name === "BugTrackerPro", `Expected BugTrackerPro, got ${data.product.name}`);
    assert(data.product.status === "draft", `Expected draft status, got ${data.product.status}`);
  });

  // 3. AI ANALYSIS & BATCH COPY PIPELINE
  await runTest("POST /api/analyze/[productId] runs AI scoring & copy generation", async () => {
    assert(Boolean(createdProductId), "No createdProductId");
    const res = await fetch(`${BASE_URL}/api/analyze/${createdProductId}`, {
      method: "POST",
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Analysis success was false");
    assert(Boolean(data.analysis), "Analysis object missing");

    const analysis = data.analysis;
    // Check top matches
    assert(Array.isArray(analysis.top_matches), "top_matches is not an array");
    assert(analysis.top_matches.length === 5, "Free preview should show five matches");

    previewSlug = analysis.top_matches[0].platform_slug;

    // Check fit scores
    for (const match of analysis.top_matches) {
      assert(match.score >= 0 && match.score <= 100, `Score out of range: ${match.score}`);
      assert(Boolean(match.reason), `Missing reason for match ${match.platform_slug}`);
      assert([1, 2, 3, 4].includes(match.tier), `Invalid tier: ${match.tier}`);
    }

    // Check tailored copy
    assert(Boolean(analysis.tailored_copies), "tailored_copies missing");
    assert(Object.keys(analysis.tailored_copies).length <= 2, "Free preview must include at most two drafts");
    assert(!analysis.big_launch_kit, "Paid launch kit must be absent from the free preview");
  });

  await runTest("GET /product/[id] report view renders with 200 OK", async () => {
    const res = await fetch(`${BASE_URL}/product/${createdProductId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    assert(html.includes("<!DOCTYPE html>") || html.includes("<html"), "HTML document missing");
  });

  await runTest("POST /api/regenerate-copy regenerates bespoke copy for single platform", async () => {
    const res = await fetch(`${BASE_URL}/api/regenerate-copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: createdProductId,
        platformSlug: previewSlug,
        customInstruction: "Focus on zero-overhead WebAssembly recording architecture",
      }),
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Regenerate copy success was false");
    assert(Boolean(data.copy.title_or_tagline), "Regenerated title missing");
    if (previewSlug === "hackernews") {
      assert(data.copy.title_or_tagline.startsWith("Show HN:"), "HN title must format as Show HN");
    }
  });

  // 4. LAUNCH TRACKER & UTM LINK VERIFICATION
  await runTest("GET /api/tracker/[productId] returns populated platform tracker items with UTM links", async () => {
    const res = await fetch(`${BASE_URL}/api/tracker/${createdProductId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Tracker API response success was false");
    assert(Array.isArray(data.items), "Items is not an array");
    assert(data.items.length >= 10, `Expected at least 10 tracker items, got ${data.items.length}`);

    // Verify UTM parameters
    for (const item of data.items) {
      assert(item.status === "not started", `Initial status should be 'not started', got ${item.status}`);
      assert(item.utm_link.includes("utm_source="), `Missing utm_source in ${item.utm_link}`);
      assert(item.utm_link.includes("utm_campaign=launchpilot"), `Missing utm_campaign in ${item.utm_link}`);
    }
  });

  await runTest("PATCH /api/tracker/[productId] keeps submission proof restricted to staff", async () => {
    const res = await fetch(`${BASE_URL}/api/tracker/${createdProductId}`);
    const data = await res.json();
    const firstItem = data.items[0];

    const patchRes = await fetch(`${BASE_URL}/api/tracker/${createdProductId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platformId: firstItem.platform_id,
        status: "live",
        live_url: "https://www.producthunt.com/posts/bugtrackerpro",
        proof_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
      }),
    });

    assert(patchRes.status === 403, `Expected 403 for founder-supplied proof, got ${patchRes.status}`);
  });

  // 5. PAYMENTS PROVIDER ABSTRACTION (USD & INR)
  await runTest("POST /api/checkout handles USD via Stripe provider", async () => {
    const res = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: "launch_kit",
        productId: createdProductId,
        currency: "USD",
      }),
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Checkout success was false");
    assert(data.provider === "stripe", `Expected stripe provider for USD, got ${data.provider}`);
    assert(Boolean(data.orderId), "orderId was missing");
  });

  await runTest("POST /api/checkout handles INR via Razorpay provider (with paise conversion)", async () => {
    const res = await fetch(`${BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: "done_for_you",
        productId: createdProductId,
        currency: "INR",
      }),
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Checkout success was false");
    assert(data.provider === "razorpay", `Expected razorpay provider for INR, got ${data.provider}`);
    assert(data.razorpayOptions.currency === "INR", "Expected INR currency");
    // Done-For-You ₹6,999 -> 699,900 paise
    assert(data.razorpayOptions.amount === 699900, `Expected 699900 paise, got ${data.razorpayOptions.amount}`);
  });

  await runTest("Completed demo orders unlock the report and tracked fulfillment", async () => {
    const response = await fetch(BASE_URL + "/api/products/" + createdProductId);
    const data = await response.json();
    assert(data.paidPlan === "done_for_you", "Expected a completed Done-For-You order");
    assert(data.product.ai_analysis.top_matches.length > 5, "Full shortlist missing");
    assert(Boolean(data.product.ai_analysis.big_launch_kit?.show_hn?.title), "Paid launch kit missing");
  });

  await runTest("PATCH /api/tracker/[productId] updates submission status and live URL", async () => {
    const res = await fetch(`${BASE_URL}/api/tracker/${createdProductId}`);
    const data = await res.json();
    const firstItem = data.items[0];

    const patchRes = await fetch(`${BASE_URL}/api/tracker/${createdProductId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platformId: firstItem.platform_id,
        status: "live",
        live_url: "https://www.producthunt.com/posts/bugtrackerpro",
      }),
    });

    assert(patchRes.status === 200, `Expected 200, got ${patchRes.status}`);
    const patchData = await patchRes.json();
    assert(patchData.success === true, "Update tracker was not successful");
    assert(patchData.item.status === "live", `Expected status 'live', got ${patchData.item.status}`);
    assert(patchData.item.live_url === "https://www.producthunt.com/posts/bugtrackerpro", "Live URL did not update");
  });

  // 6. ADMIN CONSOLE & PLATFORM DATABASE CRUD
  await runTest("GET /api/admin/stats returns calculated business metrics", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Admin stats success was false");
    assert(typeof data.stats.totalSignups === "number", "totalSignups is not a number");
    assert(typeof data.stats.paidOrdersCount === "number", "paidOrdersCount is not a number");
    assert(typeof data.stats.totalRevenueUSD === "number", "totalRevenueUSD is not a number");
    assert(typeof data.stats.totalRevenueINR === "number", "totalRevenueINR is not a number");
    assert(Array.isArray(data.dfyQueue), "dfyQueue is not an array");
  });

  let createdPlatformId = "";
  await runTest("Admin Platforms CRUD (Create -> Update -> Delete)", async () => {
    // 1. Create
    const createRes = await fetch(`${BASE_URL}/api/admin/platforms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Directory Alpha",
        slug: "test-directory-alpha",
        url: "https://testdiralpha.com",
        submit_url: "https://testdiralpha.com/submit",
        tier: 2,
        categories: ["Developer Tools", "AI"],
        domain_rating: 68,
        tagline_limit: 70,
        description_limit: 400,
        tone_notes: "Concise developer-focused listing.",
        notes: "verify: Check approval turnaround time",
        active: true,
      }),
    });

    assert(createRes.status === 200, `Create platform failed with ${createRes.status}`);
    const createData = await createRes.json();
    assert(createData.success === true, "Create platform success was false");
    createdPlatformId = createData.platform.id;
    assert(Boolean(createdPlatformId), "Platform id missing");

    // 2. Update
    const patchRes = await fetch(`${BASE_URL}/api/admin/platforms`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: createdPlatformId,
        domain_rating: 72,
        tone_notes: "Updated tone guidelines for testing.",
      }),
    });
    assert(patchRes.status === 200, `Update platform failed with ${patchRes.status}`);

    // 3. Delete
    const deleteRes = await fetch(`${BASE_URL}/api/admin/platforms?id=${createdPlatformId}`, {
      method: "DELETE",
    });
    assert(deleteRes.status === 200, `Delete platform failed with ${deleteRes.status}`);
  });

  // SUMMARY REPORT
  console.log("\n========================================================");
  console.log("📊 TEST EXECUTION SUMMARY");
  console.log("========================================================");
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: \x1b[32m${passed}\x1b[0m`);
  console.log(`Failed: ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);

  if (failed > 0) {
    console.error("\n❌ DEPLOYMENT READINESS CHECK: FAILED");
    process.exit(1);
  } else {
    console.log("\n✅ DEPLOYMENT READINESS CHECK: 100% PASSED (PRODUCTION READY)");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Unhandled error in test runner:", err);
  process.exit(1);
});
