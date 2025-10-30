import { storage } from "./storage";

async function seedData() {
  try {
    console.log("Starting data seeding...");

    // Create agencies
    const agency1 = await storage.createAgency({
      name: "Agence Casablanca Centre",
      code: "CASA-01",
    });
    console.log("Created agency:", agency1.name);

    const agency2 = await storage.createAgency({
      name: "Agence Rabat Hay Riad",
      code: "RABAT-01",
    });
    console.log("Created agency:", agency2.name);

    // Create users
    const admin = await storage.createUser({
      username: "admin",
      password: "admin123",
      role: "admin",
      agencyId: null,
      fullName: "Administrateur Système",
    });
    console.log("Created admin:", admin.username);

    const agent1 = await storage.createUser({
      username: "agent1",
      password: "agent123",
      role: "agent",
      agencyId: agency1.id,
      fullName: "Ahmed El Mansouri",
    });
    console.log("Created agent:", agent1.username, "at", agency1.name);

    const agent2 = await storage.createUser({
      username: "agent2",
      password: "agent123",
      role: "agent",
      agencyId: agency1.id,
      fullName: "Fatima Zahra",
    });
    console.log("Created agent:", agent2.username, "at", agency1.name);

    const agent3 = await storage.createUser({
      username: "agent3",
      password: "agent123",
      role: "agent",
      agencyId: agency2.id,
      fullName: "Mohammed Benali",
    });
    console.log("Created agent:", agent3.username, "at", agency2.name);

    console.log("\nSeed data created successfully!");
    console.log("\nAgencies:");
    console.log(`- ${agency1.name} (${agency1.code}): 2 agents`);
    console.log(`- ${agency2.name} (${agency2.code}): 1 agent`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
