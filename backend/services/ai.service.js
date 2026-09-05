/**
 * Optional AI explanation layer (README: "AI explanation layer").
 *
 * The clinical risk SCORE itself is always computed deterministically by
 * the DB trigger trg_vital_before_insert — that never depends on this file.
 * This service only rephrases the already-computed, already-explainable
 * reason string into plainer language via the Claude API, and ONLY when
 * ANTHROPIC_API_KEY + AI_EXPLANATION_ENABLED=true are set. If the key is
 * missing, the flag is off, or the API call fails for any reason, callers
 * always get the deterministic explanation back instead — the system never
 * depends on this call succeeding.
 */

const AI_ENABLED = String(process.env.AI_EXPLANATION_ENABLED).toLowerCase() === 'true';
const API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * Builds the deterministic, rule-based explanation. This is exactly the
 * same reasoning the database trigger already produced in
 * critical_alerts.message — we just also expose it as a structured object
 * so the API response shape is consistent whether or not AI ran.
 */
function deterministicExplanation(alert) {
  return alert.message || 'Risk assessment based on demo/educational vital-sign thresholds.';
}

/**
 * Attempts to call the Claude API to rephrase the deterministic reason in
 * plainer language. Returns { explanation, source: 'ai' } on success, or
 * { explanation, source: 'deterministic' } on any failure/disabled state.
 */
async function explainAlert(alert) {
  const fallback = { explanation: deterministicExplanation(alert), source: 'deterministic' };

  if (!AI_ENABLED || !API_KEY) {
    return fallback;
  }

  try {
    const prompt = `You are helping explain a hospital's rule-based clinical risk score to a nurse
or doctor in plain, reassuring, non-alarmist clinical language. The score and
reasons below were computed deterministically by a database trigger using
DEMO/EDUCATIONAL thresholds — never invent additional medical detail or
diagnosis; just restate the given reasons more clearly in 1-3 short sentences.

Patient: ${alert.patient_name}
Severity: ${alert.severity}
Risk score: ${alert.risk_score}
SpO2: ${alert.spo2 ?? 'n/a'}, Heart rate: ${alert.heart_rate ?? 'n/a'}, BP: ${alert.systolic_bp ?? 'n/a'}/${alert.diastolic_bp ?? 'n/a'}
Deterministic reasoning: ${alert.message}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    if (!textBlock || !textBlock.text) {
      return fallback;
    }

    return { explanation: textBlock.text.trim(), source: 'ai' };
  } catch (err) {
    // Network error, timeout, malformed response, etc. — always degrade
    // gracefully to the deterministic explanation rather than failing
    // the request.
    return fallback;
  }
}

module.exports = { explainAlert, deterministicExplanation };
