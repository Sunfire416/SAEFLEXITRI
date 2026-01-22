const SupabaseService = require('../services/SupabaseService');

class Voyage {
  static async create(data) {
    const payload = {
      id_pmr: data.id_pmr,
      id_accompagnant: data.id_accompagnant || null,
      date_debut: data.date_debut ? new Date(data.date_debut).toISOString() : null,
      date_fin: data.date_fin ? new Date(data.date_fin).toISOString() : null,
      lieu_depart: data.lieu_depart || {},
      lieu_arrivee: data.lieu_arrivee || data.lieu_arrive || {},
      bagage: Array.isArray(data.bagage) ? data.bagage : [],
      etapes: Array.isArray(data.etapes) ? data.etapes : [],
      prix_total: data.prix_total || 0,
      status: data.status || 'planned'
    };

    const { data: created, error } = await SupabaseService.client
      .from('voyages')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Voyage.create (Supabase) error:', error.message);
      throw error;
    }

    return {
      ...created,
      _id: created.id_voyage,
      id_voyage: created.id_voyage,
      etapes: created.etapes || payload.etapes
    };
  }
}

module.exports = Voyage;