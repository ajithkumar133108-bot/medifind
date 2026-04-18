const symptomMapping = {
  fever: ['Paracetamol', 'Dolo-650', 'Calpol'],
  headache: ['Paracetamol', 'Ibuprofen', 'Cetirizine'],
  cough: ['Cough Syrup', 'Dextromethorphan', 'Cetirizine'],
  cold: ['Cetirizine', 'Loratadine', 'Vitamin C'],
  allergy: ['Cetirizine', 'Loratadine', 'Alerid'],
  stomach: ['Omeprazole', 'Ranitidine', 'Pantoprazole'],
  diabetes: ['Metformin', 'Glycomet'],
  infection: ['Amoxicillin', 'Azithromycin'],
  pain: ['Paracetamol', 'Ibuprofen', 'Diclofenac'],
};

function extractKeywords(text) {
  if (!text) return [];
  const normalized = text.toLowerCase();
  return Object.keys(symptomMapping).filter((key) => normalized.includes(key));
}

function suggestMedicines(text) {
  const keys = extractKeywords(text);
  const recommendations = new Set();
  keys.forEach((key) => {
    symptomMapping[key].forEach((medicine) => recommendations.add(medicine));
  });
  return {
    symptoms: keys,
    medicines: keys.length ? Array.from(recommendations).slice(0, 8) : [],
    message: keys.length
      ? `Suggested medicines for ${keys.join(', ')}.`
      : 'Try typing symptoms like fever, cough, headache, allergy, or stomach.',
  };
}

module.exports = { suggestMedicines };
