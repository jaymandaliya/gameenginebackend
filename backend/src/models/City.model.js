import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema({
  type:  { type: String, required: true },
  level: { type: Number, default: 1 },
  upgrading_until: Date,
}, { _id: false });

const citySchema = new mongoose.Schema({
  player_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name:            { type: String, default: 'My City' },
  map_x:           { type: Number, default: 0 },
  map_y:           { type: Number, default: 0 },
  terrain_type:    { type: String, enum: ['plains','forest','desert','mountain','snow','coastal','volcano','swamp'], default: 'plains' },
  city_hall_level: { type: Number, default: 1, min: 1, max: 30 },
  wall_level:      { type: Number, default: 1, min: 1, max: 20 },
  wall_hp:         { type: Number, default: 10000 },
  wall_hp_max:     { type: Number, default: 10000 },
  buildings:       { type: [buildingSchema], default: [] },
  power_score:     { type: Number, default: 0 },
  beginner_shield_until: Date,
  is_shielded:     { type: Boolean, default: true },
  resources: {
    gold:          { type: Number, default: 5000 },
    food:          { type: Number, default: 5000 },
    wood:          { type: Number, default: 3000 },
    stone:         { type: Number, default: 2000 },
    mana:          { type: Number, default: 0 },
    dragon_energy: { type: Number, default: 0 },
    trade_goods:   { type: Number, default: 0 },
    gems:          { type: Number, default: 50 },
  },
  last_resource_tick: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

citySchema.index({ map_x: 1, map_y: 1 });
citySchema.index({ player_id: 1 });

export default mongoose.model('City', citySchema);
