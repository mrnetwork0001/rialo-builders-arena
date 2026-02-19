import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase env vars missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { participant_id } = await req.json();
    if (!participant_id) {
      return new Response(JSON.stringify({ error: "participant_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch participant + session info
    const { data: participant, error: pErr } = await supabase
      .from("participants")
      .select(`
        id, display_name, discord_handle, project_title, description, project_link, twitter_handle,
        session:session_id ( week_label, session_date )
      `)
      .eq("id", participant_id)
      .single();

    if (pErr || !participant) {
      return new Response(JSON.stringify({ error: "Participant not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch followers
    const { data: followers, error: fErr } = await supabase
      .from("builder_followers")
      .select("email")
      .eq("discord_handle", participant.discord_handle);

    if (fErr || !followers || followers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No followers to notify" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = participant.session as { week_label: string; session_date: string } | null;
    const profileUrl = `https://rialo-builders-arena.lovable.app/builders/${encodeURIComponent(participant.discord_handle)}`;
    const sessionDate = session?.session_date
      ? new Date(session.session_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "";
    const weekLabel = session?.week_label ?? "this week";

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New session from ${participant.display_name}</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;text-align:center;">
              <span style="font-size:22px;font-weight:700;color:#00e5b4;letter-spacing:-0.5px;">Rialo Builder's Hub</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(145deg,#1a1f2e,#141820);border:1px solid #2a3040;border-radius:16px;padding:36px;">

              <!-- Pill badge -->
              <div style="margin-bottom:20px;">
                <span style="display:inline-block;background:rgba(0,229,180,0.12);border:1px solid rgba(0,229,180,0.3);color:#00e5b4;font-size:11px;font-weight:600;padding:4px 12px;border-radius:999px;letter-spacing:0.5px;text-transform:uppercase;">
                  🔥 New Session Alert
                </span>
              </div>

              <!-- Headline -->
              <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:700;color:#f1f5f9;line-height:1.3;">
                ${participant.display_name} is building again!
              </h1>
              <p style="margin:0 0 24px 0;font-size:14px;color:#64748b;">
                ${weekLabel}${sessionDate ? ` · ${sessionDate}` : ""}
              </p>

              ${participant.project_title ? `
              <!-- Project -->
              <div style="background:rgba(0,229,180,0.06);border:1px solid rgba(0,229,180,0.15);border-radius:10px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;color:#00e5b4;text-transform:uppercase;letter-spacing:0.5px;">Project</p>
                <p style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#f1f5f9;">${participant.project_title}</p>
                ${participant.description ? `<p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6;">${participant.description.slice(0, 200)}${participant.description.length > 200 ? "…" : ""}</p>` : ""}
              </div>` : ""}

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-radius:8px;background:linear-gradient(135deg,#00e5b4,#00b894);">
                    <a href="${profileUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#0f1117;text-decoration:none;border-radius:8px;">
                      👀 View Profile &amp; React →
                    </a>
                  </td>
                  ${participant.project_link ? `
                  <td style="padding-left:12px;">
                    <a href="${participant.project_link}" style="display:inline-block;padding:13px 20px;font-size:14px;font-weight:600;color:#00e5b4;text-decoration:none;border:1px solid rgba(0,229,180,0.3);border-radius:8px;">
                      🚀 View Project
                    </a>
                  </td>` : ""}
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #1e2433;margin:0 0 20px 0;" />

              <!-- Footer note -->
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                You're receiving this because you followed <strong style="color:#64748b;">${participant.display_name}</strong> on Rialo Builder's Hub.<br/>
                Built by <a href="https://x.com/encrypt_wizard" style="color:#00e5b4;text-decoration:none;">MrNetwork</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send emails via Resend
    let sent = 0;
    const errors: string[] = [];

    for (const { email } of followers) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Rialo Builder's Hub <notifications@rialo-builders-arena.lovable.app>",
          to: [email],
          subject: `🔥 ${participant.display_name} is building again this week on Rialo!`,
          html: htmlBody,
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        const err = await res.text();
        errors.push(`${email}: ${err}`);
        console.error(`Failed to send to ${email}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ sent, total: followers.length, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("notify-followers error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
