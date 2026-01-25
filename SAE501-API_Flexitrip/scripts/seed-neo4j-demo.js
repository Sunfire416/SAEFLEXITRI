const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.NEO4J_URL || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

async function seedStations() {
  const session = driver.session();
  
  try {
    console.log('🌱 Seeding Neo4j stations...');
    
    // 1. Supprimer données existantes
    await session.run('MATCH (n) DETACH DELETE n');
    
    // 2. Créer 5 stations
    await session.run(`
      CREATE (paris:Station {
        id: 'paris-gare-lyon',
        name: 'Paris Gare de Lyon',
        city: 'Paris',
        type: 'TRAIN',
        lat: 48.8433,
        lng: 2.3737,
        accessible_pmr: true
      })
      CREATE (lyon_train:Station {
        id: 'lyon-part-dieu',
        name: 'Lyon Part-Dieu',
        city: 'Lyon',
        type: 'TRAIN',
        lat: 45.7640,
        lng: 4.8357,
        accessible_pmr: true
      })
      CREATE (lyon_bus:Station {
        id: 'lyon-gare-routiere',
        name: 'Lyon Gare Routière',
        city: 'Lyon',
        type: 'BUS',
        lat: 45.7600,
        lng: 4.8300,
        accessible_pmr: true
      })
      CREATE (marseille_gare:Station {
        id: 'marseille-gare',
        name: 'Marseille St-Charles',
        city: 'Marseille',
        type: 'TRAIN',
        lat: 43.3029,
        lng: 5.3808,
        accessible_pmr: true
      })
      CREATE (marseille_airport:Station {
        id: 'marseille-airport',
        name: 'Marseille Provence Airport',
        city: 'Marseille',
        type: 'FLIGHT',
        lat: 43.4397,
        lng: 5.2152,
        accessible_pmr: true
      })
      
      // 3. Créer routes
      CREATE (paris)-[:CONNECTED_BY {
        transport: 'TRAIN',
        operator: 'SNCF',
        duration_min: 120,
        price_eur: 50.0,
        accessible_pmr: true,
        departure_time: '08:00',
        arrival_time: '10:00'
      }]->(lyon_train)
      
      CREATE (lyon_train)-[:CONNECTED_BY {
        transport: 'WALK',
        operator: 'PEDESTRIAN',
        duration_min: 15,
        price_eur: 0.0,
        accessible_pmr: true
      }]->(lyon_bus)
      
      CREATE (lyon_bus)-[:CONNECTED_BY {
        transport: 'BUS',
        operator: 'FlixBus',
        duration_min: 180,
        price_eur: 25.0,
        accessible_pmr: true,
        departure_time: '11:00',
        arrival_time: '14:00'
      }]->(marseille_gare)
      
      CREATE (marseille_gare)-[:CONNECTED_BY {
        transport: 'TRAIN',
        operator: 'SNCF',
        duration_min: 30,
        price_eur: 20.0,
        accessible_pmr: true,
        departure_time: '15:00',
        arrival_time: '15:30'
      }]->(marseille_airport)
      
      RETURN count(*) as stations_created
    `);
    
    console.log('✅ Neo4j seeded successfully!');
    
    // Vérification
    const result = await session.run('MATCH (n:Station) RETURN count(n) as count');
    console.log(`📊 ${result.records[0].get('count')} stations created`);
    
  } catch (error) {
    console.error('❌ Error seeding Neo4j:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedStations();
