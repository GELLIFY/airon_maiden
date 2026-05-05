import "dotenv/config";

import { reset } from "drizzle-seed";
import { auth } from "@/libs/better-auth/auth";
import { db } from ".";
import { schema } from "./schema";
import {
  actionItemTable,
  cardTable,
  projectMemberTable,
  projectTable,
  retrospectiveTable,
  voteTable,
} from "./schema/airon";
import { account, user } from "./schema/auth-schema";

async function main() {
  await reset(db, schema);

  // ---- Users ----
  const seedUsers = [
    { email: "matteo.badini@gellify.com", name: "Matteo Badini" },
    { email: "sara.torsiello@gellify.com", name: "Sara Torsiello" },
    { email: "luca.rossi@gellify.com", name: "Luca Rossi" },
    { email: "giulia.bianchi@gellify.com", name: "Giulia Bianchi" },
  ];

  const createdUsers = await db
    .insert(user)
    .values(seedUsers)
    .returning({ id: user.id, email: user.email });

  if (createdUsers.length !== seedUsers.length) {
    throw new Error("Error creating users");
  }

  const context = await auth.$context;
  const hash = await context.password.hash("password");

  await db.insert(account).values(
    createdUsers.map((u) => ({
      userId: u.id,
      providerId: "credential",
      accountId: u.id,
      password: hash,
    })),
  );

  const [matteo, sara, luca, giulia] = createdUsers;
  if (!matteo || !sara || !luca || !giulia) {
    throw new Error("Missing seeded users");
  }

  // ---- Projects ----
  const [pAlpha, pBeta, pGamma] = await db
    .insert(projectTable)
    .values([
      {
        name: "Airon Core Platform",
        description:
          "Sviluppo della piattaforma core per la gestione di retrospettive Agile.",
        startDate: "2026-01-15",
        endDate: "2026-12-31",
        status: "ATTIVO",
      },
      {
        name: "Mobile Companion App",
        description:
          "App mobile per consultare retrospettive e action items in mobilità.",
        startDate: "2026-03-01",
        endDate: "2026-09-30",
        status: "ATTIVO",
      },
      {
        name: "Legacy Migration 2025",
        description: "Migrazione completata dal vecchio sistema al nuovo stack.",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        status: "ARCHIVIATO",
      },
    ])
    .returning();

  if (!pAlpha || !pBeta || !pGamma) {
    throw new Error("Error creating projects");
  }

  // ---- Members ----
  await db.insert(projectMemberTable).values([
    { projectId: pAlpha.id, userId: matteo.id },
    { projectId: pAlpha.id, userId: sara.id },
    { projectId: pAlpha.id, userId: luca.id },
    { projectId: pAlpha.id, userId: giulia.id },

    { projectId: pBeta.id, userId: sara.id },
    { projectId: pBeta.id, userId: luca.id },

    { projectId: pGamma.id, userId: matteo.id },
    { projectId: pGamma.id, userId: sara.id },
  ]);

  // ---- Retrospectives ----
  const [rAlpha1, rAlpha2, rAlpha3, rBeta1, rGamma1] = await db
    .insert(retrospectiveTable)
    .values([
      {
        projectId: pAlpha.id,
        name: "Sprint 1 - Kickoff",
        startDate: "2026-01-15",
        endDate: "2026-01-29",
        votesPerUser: 3,
        status: "CHIUSA",
      },
      {
        projectId: pAlpha.id,
        name: "Sprint 2 - Auth & Onboarding",
        startDate: "2026-01-30",
        endDate: "2026-02-13",
        votesPerUser: 3,
        status: "CHIUSA",
      },
      {
        projectId: pAlpha.id,
        name: "Sprint 3 - Dashboard MVP",
        startDate: "2026-02-14",
        endDate: "2026-02-28",
        votesPerUser: 3,
        status: "VOTING",
      },
      {
        projectId: pBeta.id,
        name: "Sprint 1 - Discovery",
        startDate: "2026-03-01",
        endDate: "2026-03-15",
        votesPerUser: 5,
        status: "APERTA",
      },
      {
        projectId: pGamma.id,
        name: "Final Retro",
        startDate: "2025-12-15",
        endDate: "2025-12-31",
        votesPerUser: 3,
        status: "CHIUSA",
      },
    ])
    .returning();

  if (!rAlpha1 || !rAlpha2 || !rAlpha3 || !rBeta1 || !rGamma1) {
    throw new Error("Error creating retrospectives");
  }

  // ---- Action Items ----
  await db.insert(actionItemTable).values([
    {
      projectId: pAlpha.id,
      retrospectiveId: rAlpha1.id,
      assigneeId: matteo.id,
      title: "Definire convenzioni di branching",
      description:
        "Documentare il flusso git-flow su Notion e condividere col team.",
      status: "DONE",
    },
    {
      projectId: pAlpha.id,
      retrospectiveId: rAlpha1.id,
      assigneeId: sara.id,
      title: "Setup CI con GitHub Actions",
      description: "Pipeline lint + typecheck + test sui PR.",
      status: "DONE",
    },
    {
      projectId: pAlpha.id,
      retrospectiveId: rAlpha2.id,
      assigneeId: luca.id,
      title: "Aggiungere copertura test su useAuth",
      description: "Test unitari sui flussi di sign-in / sign-up.",
      status: "IN_PROGRESS",
    },
    {
      projectId: pAlpha.id,
      retrospectiveId: rAlpha2.id,
      assigneeId: giulia.id,
      title: "Refactor email templates",
      description: "Centralizzare layout react-email in un wrapper riusabile.",
      status: "TO_DO",
    },
    {
      projectId: pAlpha.id,
      retrospectiveId: rAlpha3.id,
      assigneeId: sara.id,
      title: "Disegnare empty state della dashboard",
      description: "Versione illustrata + CTA per creare il primo progetto.",
      status: "TO_DO",
    },
    {
      projectId: pAlpha.id,
      retrospectiveId: rAlpha3.id,
      assigneeId: matteo.id,
      title: "Pianificare migrazione a Next 16",
      description: "Stimare effort, rischi e ordine di rollout.",
      status: "CANCELED",
    },
    {
      projectId: pBeta.id,
      retrospectiveId: rBeta1.id,
      assigneeId: luca.id,
      title: "Spike su React Native vs Expo",
      description: "POC veloce per scegliere lo stack mobile.",
      status: "IN_PROGRESS",
    },
    {
      projectId: pBeta.id,
      retrospectiveId: rBeta1.id,
      assigneeId: sara.id,
      title: "Definire personas per app mobile",
      description: "3 personas principali + journey map.",
      status: "TO_DO",
    },
    {
      projectId: pGamma.id,
      retrospectiveId: rGamma1.id,
      assigneeId: matteo.id,
      title: "Decommissionare istanza legacy",
      description: "Spegnere VM e archiviare dump finale.",
      status: "DONE",
    },
  ]);

  // ---- Cards (Sprint 3 in VOTING) ----
  const insertedCards = await db
    .insert(cardTable)
    .values([
      // WENT_WELL
      {
        retrospectiveId: rAlpha3.id,
        authorId: matteo.id,
        column: "WENT_WELL",
        content: "Deploy automatico finalmente stabile dopo le fix di giovedì",
      },
      {
        retrospectiveId: rAlpha3.id,
        authorId: sara.id,
        column: "WENT_WELL",
        content: "Comunicazione nel daily più efficace, tutti puntuali e concisi",
      },
      {
        retrospectiveId: rAlpha3.id,
        authorId: luca.id,
        column: "WENT_WELL",
        content: "Code review veloci e costruttive, feedback in meno di 2 ore",
      },
      // TO_IMPROVE
      {
        retrospectiveId: rAlpha3.id,
        authorId: giulia.id,
        column: "TO_IMPROVE",
        content: "Stime ancora troppo ottimistiche: 3 story portate al prossimo sprint",
      },
      {
        retrospectiveId: rAlpha3.id,
        authorId: matteo.id,
        column: "TO_IMPROVE",
        content: "Documentazione tecnica sempre in ritardo rispetto al codice",
      },
      {
        retrospectiveId: rAlpha3.id,
        authorId: sara.id,
        column: "TO_IMPROVE",
        content: "Meeting di refinement troppo lunghi, serve un facilitatore dedicato",
      },
      // ACTION_ITEMS
      {
        retrospectiveId: rAlpha3.id,
        authorId: luca.id,
        column: "ACTION_ITEMS",
        content: "Introdurre planning poker nel prossimo sprint planning",
      },
      {
        retrospectiveId: rAlpha3.id,
        authorId: giulia.id,
        column: "ACTION_ITEMS",
        content: "Creare template ADR nel wiki di progetto (Confluence)",
      },
      {
        retrospectiveId: rAlpha3.id,
        authorId: matteo.id,
        column: "ACTION_ITEMS",
        content: "Workshop interno sulle tecniche di stima con il team dev",
      },
    ])
    .returning();

  // ---- Votes ----
  const cardByContent = (snippet: string) =>
    insertedCards.find((c) => c.content.startsWith(snippet));

  const voteRows: { cardId: string; userId: string }[] = [];
  const addVotes = (snippet: string, voters: { id: string }[]) => {
    const card = cardByContent(snippet);
    if (!card) return;
    for (const v of voters) {
      voteRows.push({ cardId: card.id, userId: v.id });
    }
  };

  addVotes("Deploy automatico", [sara, luca, giulia, matteo]);
  addVotes("Comunicazione nel daily", [luca, giulia]);
  addVotes("Code review veloci", [giulia]);
  addVotes("Stime ancora troppo", [matteo, sara, luca, giulia, sara]);
  addVotes("Documentazione tecnica", [matteo, sara, luca]);
  addVotes("Introdurre planning poker", [matteo, sara]);
  addVotes("Creare template ADR", [luca]);

  // dedup by (cardId,userId)
  const seen = new Set<string>();
  const uniqueVotes = voteRows.filter((v) => {
    const k = `${v.cardId}:${v.userId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (uniqueVotes.length > 0) {
    await db.insert(voteTable).values(uniqueVotes);
  }

  await db.$client.end();
}

await main();
