'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get existing BOMs
    const boms = await queryInterface.sequelize.query(
      'SELECT id, product_id FROM boms ORDER BY created_at',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get existing work centers
    const workCenters = await queryInterface.sequelize.query(
      'SELECT id, name FROM work_centers ORDER BY created_at',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (boms.length === 0 || workCenters.length === 0) {
      console.log('No BOMs or work centers found. Skipping BOM operations seeding.');
      return;
    }

    // Define common manufacturing operations
    const operationTemplates = [
      {
        operation: 'Material Preparation',
        operation_type: 'preparation',
        duration: 30,
        setup_time: 10,
        teardown_time: 5,
        cost_per_hour: 25.00,
        description: 'Prepare and organize raw materials for production',
        instructions: 'Check material quality, organize by sequence, ensure proper storage conditions',
        quality_requirements: [
          { type: 'visual_inspection', criteria: 'No visible defects or contamination' },
          { type: 'quantity_check', criteria: 'Verify quantities match BOM requirements' }
        ],
        tools_required: ['measuring_tools', 'inspection_equipment', 'material_handling_equipment'],
        skills_required: ['material_handling', 'quality_inspection']
      },
      {
        operation: 'Cutting',
        operation_type: 'machining',
        duration: 45,
        setup_time: 15,
        teardown_time: 10,
        cost_per_hour: 35.00,
        description: 'Cut materials to required dimensions',
        instructions: 'Set up cutting equipment, verify measurements, perform cuts according to specifications',
        quality_requirements: [
          { type: 'dimensional_check', criteria: 'Dimensions within ±0.1mm tolerance' },
          { type: 'surface_finish', criteria: 'Smooth finish, no burrs or rough edges' }
        ],
        tools_required: ['cutting_machine', 'measuring_tools', 'safety_equipment'],
        skills_required: ['machine_operation', 'precision_measurement']
      },
      {
        operation: 'Assembly',
        operation_type: 'assembly',
        duration: 60,
        setup_time: 20,
        teardown_time: 15,
        cost_per_hour: 30.00,
        description: 'Assemble components according to specifications',
        instructions: 'Follow assembly sequence, use proper torque specifications, verify fit and alignment',
        quality_requirements: [
          { type: 'fit_check', criteria: 'All components fit properly without forcing' },
          { type: 'alignment_check', criteria: 'All parts properly aligned within specifications' },
          { type: 'fastener_torque', criteria: 'All fasteners torqued to specification' }
        ],
        tools_required: ['hand_tools', 'torque_wrench', 'assembly_fixtures'],
        skills_required: ['assembly_techniques', 'mechanical_aptitude']
      },
      {
        operation: 'Quality Control',
        operation_type: 'inspection',
        duration: 20,
        setup_time: 5,
        teardown_time: 5,
        cost_per_hour: 40.00,
        description: 'Perform quality inspection and testing',
        instructions: 'Conduct visual inspection, dimensional checks, and functional testing as required',
        quality_requirements: [
          { type: 'visual_inspection', criteria: 'No visible defects, proper finish' },
          { type: 'dimensional_inspection', criteria: 'All dimensions within tolerance' },
          { type: 'functional_test', criteria: 'Product functions as designed' }
        ],
        tools_required: ['measuring_instruments', 'test_equipment', 'inspection_tools'],
        skills_required: ['quality_inspection', 'measurement_techniques']
      },
      {
        operation: 'Packaging',
        operation_type: 'finishing',
        duration: 15,
        setup_time: 5,
        teardown_time: 5,
        cost_per_hour: 20.00,
        description: 'Package finished product for shipment',
        instructions: 'Clean product, apply protective materials, place in appropriate packaging',
        quality_requirements: [
          { type: 'cleanliness_check', criteria: 'Product clean and free of debris' },
          { type: 'packaging_integrity', criteria: 'Packaging secure and undamaged' }
        ],
        tools_required: ['packaging_materials', 'cleaning_supplies', 'labeling_equipment'],
        skills_required: ['packaging_techniques', 'attention_to_detail']
      }
    ];

    const bomOperations = [];

    // Create operations for each BOM
    boms.forEach((bom, bomIndex) => {
      operationTemplates.forEach((template, templateIndex) => {
        // Assign work center (cycle through available work centers)
        const workCenter = workCenters[templateIndex % workCenters.length];
        
        // Calculate total cost based on duration and cost per hour
        const totalDuration = template.duration + template.setup_time + template.teardown_time;
        const totalCost = (totalDuration / 60) * template.cost_per_hour;

        bomOperations.push({
          id: uuidv4(),
          bom_id: bom.id,
          operation: template.operation,
          operation_type: template.operation_type,
          work_center_id: workCenter.id,
          duration: template.duration,
          setup_time: template.setup_time,
          teardown_time: template.teardown_time,
          cost_per_hour: template.cost_per_hour,
          total_cost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
          sequence: templateIndex + 1,
          description: template.description,
          instructions: template.instructions,
          quality_requirements: JSON.stringify(template.quality_requirements),
          tools_required: template.tools_required,
          skills_required: template.skills_required,
          metadata: JSON.stringify({
            estimated_labor_hours: totalDuration / 60,
            complexity_level: templateIndex < 2 ? 'low' : templateIndex < 4 ? 'medium' : 'high'
          }),
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    });

    await queryInterface.bulkInsert('bom_operations', bomOperations);
    console.log(`Seeded ${bomOperations.length} BOM operations for ${boms.length} BOMs`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('bom_operations', null, {});
  }
};
