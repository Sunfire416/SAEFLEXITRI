/**
 * Service OCR - Compatible AWS Textract DetectDocumentText API
 * 
 * PRODUCTION : Remplacer simulateOCR() par AWS SDK
 * Installation : npm install @aws-sdk/client-textract
 * 
 * Format de réponse identique à AWS Textract pour migration facile
 */

/**
 * Simule l'extraction OCR d'une pièce d'identité
 * @param {string} imageBase64 - Image encodée en base64
 * @param {string} documentType - Type de document ('passeport' ou 'cni')
 * @returns {Object} Réponse format AWS Textract
 */
const simulateOCR = async (imageBase64, documentType = 'cni') => {
  // SIMULATION : Génère données réalistes selon le type de document
  
  // Liste de noms français réalistes pour variation
  const noms = ['DUPONT', 'MARTIN', 'BERNARD', 'THOMAS', 'PETIT', 'ROBERT', 'RICHARD'];
  const prenoms = ['JEAN', 'MARIE', 'PIERRE', 'SOPHIE', 'LUC', 'ANNE', 'PAUL'];
  
  const nom = noms[Math.floor(Math.random() * noms.length)];
  const prenom = prenoms[Math.floor(Math.random() * prenoms.length)];
  
  // Génère date de naissance aléatoire (entre 1950 et 2000)
  const year = 1950 + Math.floor(Math.random() * 50);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const dateNaissance = `${day}.${month}.${year}`;
  
  // Génère numéro document
  const numeroDoc = documentType === 'passeport' 
    ? `${Math.floor(Math.random() * 90 + 10)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 900000 + 100000)}`
    : `${year.toString().substr(2)}${month}${day}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 900 + 100)}`;
  
  // Simule latence réseau réaliste (100-300ms)
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  
  // Format AWS Textract DetectDocumentText (structure réelle)
  return {
    DocumentMetadata: {
      Pages: 1
    },
    Blocks: [
      {
        BlockType: "LINE",
        Id: "1",
        Text: documentType === 'passeport' ? "PASSEPORT" : "RÉPUBLIQUE FRANÇAISE",
        Confidence: 99.5,
        Geometry: {
          BoundingBox: {
            Width: 0.8,
            Height: 0.05,
            Left: 0.1,
            Top: 0.05
          }
        }
      },
      {
        BlockType: "LINE",
        Id: "2",
        Text: documentType === 'passeport' ? "PASSPORT" : "CARTE NATIONALE D'IDENTITÉ",
        Confidence: 99.2,
        Geometry: {
          BoundingBox: {
            Width: 0.7,
            Height: 0.04,
            Left: 0.15,
            Top: 0.12
          }
        }
      },
      {
        BlockType: "KEY_VALUE_SET",
        Id: "3",
        EntityTypes: ["KEY"],
        Text: "Nom:",
        Confidence: 98.5,
        Geometry: { BoundingBox: { Width: 0.1, Height: 0.03, Left: 0.1, Top: 0.25 } }
      },
      {
        BlockType: "KEY_VALUE_SET",
        Id: "4",
        EntityTypes: ["VALUE"],
        Text: nom,
        Confidence: 97.8 + Math.random() * 2,
        Geometry: { BoundingBox: { Width: 0.3, Height: 0.03, Left: 0.25, Top: 0.25 } }
      },
      {
        BlockType: "KEY_VALUE_SET",
        Id: "5",
        EntityTypes: ["KEY"],
        Text: "Prénom(s):",
        Confidence: 98.2,
        Geometry: { BoundingBox: { Width: 0.12, Height: 0.03, Left: 0.1, Top: 0.30 } }
      },
      {
        BlockType: "KEY_VALUE_SET",
        Id: "6",
        EntityTypes: ["VALUE"],
        Text: prenom,
        Confidence: 96.5 + Math.random() * 3,
        Geometry: { BoundingBox: { Width: 0.25, Height: 0.03, Left: 0.25, Top: 0.30 } }
      },
      {
        BlockType: "KEY_VALUE_SET",
        Id: "7",
        EntityTypes: ["KEY"],
        Text: "Né(e) le:",
        Confidence: 97.5,
        Geometry: { BoundingBox: { Width: 0.1, Height: 0.03, Left: 0.1, Top: 0.35 } }
      },
      {
        BlockType: "KEY_VALUE_SET",
        Id: "8",
        EntityTypes: ["VALUE"],
        Text: dateNaissance,
        Confidence: 98.9 + Math.random(),
        Geometry: { BoundingBox: { Width: 0.15, Height: 0.03, Left: 0.25, Top: 0.35 } }
      },
      {
        BlockType: "KEY_VALUE_SET",
        Id: "9",
        EntityTypes: ["KEY"],
        Text: documentType === 'passeport' ? "N° Passeport:" : "N°:",
        Confidence: 99.1,
        Geometry: { BoundingBox: { Width: 0.12, Height: 0.03, Left: 0.1, Top: 0.40 } }
      },
      {
        BlockType: "KEY_VALUE_SET",
        Id: "10",
        EntityTypes: ["VALUE"],
        Text: numeroDoc,
        Confidence: 99.8,
        Geometry: { BoundingBox: { Width: 0.2, Height: 0.03, Left: 0.25, Top: 0.40 } }
      },
      {
        BlockType: "KEY_VALUE_SET",
        Id: "11",
        EntityTypes: ["KEY"],
        Text: "Nationalité:",
        Confidence: 98.0,
        Geometry: { BoundingBox: { Width: 0.12, Height: 0.03, Left: 0.1, Top: 0.45 } }
      },
      {
        BlockType: "KEY_VALUE_SET",
        Id: "12",
        EntityTypes: ["VALUE"],
        Text: "FRANÇAISE",
        Confidence: 97.5 + Math.random() * 2,
        Geometry: { BoundingBox: { Width: 0.15, Height: 0.03, Left: 0.25, Top: 0.45 } }
      }
    ]
  };
};

/**
 * Parse les blocs OCR bruts → Données structurées
 * Compatible AWS Textract et Google Vision
 * @param {Object} ocrResponse - Réponse AWS Textract
 * @returns {Object} Données extraites structurées
 */
const parseOCRResult = (ocrResponse) => {
  const blocks = ocrResponse.Blocks;
  
  const extractedData = {
    nom: null,
    prenom: null,
    date_naissance: null,
    numero_id: null,
    nationalite: null,
    type_document: null,
    confidence_moyenne: 0
  };
  
  const confidences = [];
  
  // Détecter type de document
  const firstLine = blocks.find(b => b.BlockType === "LINE")?.Text || '';
  extractedData.type_document = firstLine.includes("PASSEPORT") ? 'passeport' : 'cni';
  
  // Extraction clé-valeur
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    if (block.BlockType === "KEY_VALUE_SET" && block.EntityTypes?.includes("KEY")) {
      const keyText = block.Text.toLowerCase();
      const valueBlock = blocks[i + 1];
      
      if (valueBlock?.EntityTypes?.includes("VALUE")) {
        if (keyText.includes("nom") && !keyText.includes("prénom")) {
          extractedData.nom = valueBlock.Text;
          confidences.push(valueBlock.Confidence);
        } else if (keyText.includes("prénom")) {
          extractedData.prenom = valueBlock.Text;
          confidences.push(valueBlock.Confidence);
        } else if (keyText.includes("né")) {
          // Convertir format JJ.MM.AAAA → AAAA-MM-DD
          const parts = valueBlock.Text.split('.');
          if (parts.length === 3) {
            extractedData.date_naissance = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            extractedData.date_naissance = valueBlock.Text;
          }
          confidences.push(valueBlock.Confidence);
        } else if (keyText.includes("n°") || keyText.includes("passeport")) {
          extractedData.numero_id = valueBlock.Text;
          confidences.push(valueBlock.Confidence);
        } else if (keyText.includes("nationalité")) {
          extractedData.nationalite = valueBlock.Text;
          confidences.push(valueBlock.Confidence);
        }
      }
    }
  }
  
  // Calcul confidence moyenne
  if (confidences.length > 0) {
    extractedData.confidence_moyenne = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }
  
  return extractedData;
};

/**
 * API principale - Traiter une image avec OCR
 * @param {string} imageBase64 - Image en base64
 * @param {string} documentType - Type de document
 * @returns {Object} Résultat OCR structuré
 */
const processOCR = async (imageBase64, documentType = 'cni') => {
  try {
    const startTime = Date.now();
    
    // SIMULATION : Appel AWS Textract
    const rawOCR = await simulateOCR(imageBase64, documentType);
    
    // Parser les résultats
    const parsedData = parseOCRResult(rawOCR);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: parsedData.confidence_moyenne > 90,
      data: parsedData,
      raw: rawOCR, // Pour debug/audit
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Erreur OCR:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

module.exports = {
  processOCR,
  parseOCRResult // Export pour tests
};

/**
 * ============================================
 * MIGRATION VERS VRAIE API AWS TEXTRACT
 * ============================================
 * 
 * 1. Installer SDK AWS :
 *    npm install @aws-sdk/client-textract
 * 
 * 2. Configuration AWS :
 *    process.env.AWS_REGION = 'eu-west-1'
 *    process.env.AWS_ACCESS_KEY_ID = 'XXX'
 *    process.env.AWS_SECRET_ACCESS_KEY = 'XXX'
 * 
 * 3. Remplacer simulateOCR() par :
 * 
 *    const { TextractClient, DetectDocumentTextCommand } = require("@aws-sdk/client-textract");
 *    
 *    const client = new TextractClient({ 
 *      region: process.env.AWS_REGION 
 *    });
 *    
 *    const realOCR = async (imageBase64) => {
 *      const command = new DetectDocumentTextCommand({
 *        Document: { 
 *          Bytes: Buffer.from(imageBase64, 'base64') 
 *        }
 *      });
 *      return await client.send(command);
 *    };
 * 
 * 4. parseOCRResult() reste IDENTIQUE (déjà compatible)
 * 
 * 5. Tester avec vraie image :
 *    const result = await processOCR(base64Image, 'cni');
 */
