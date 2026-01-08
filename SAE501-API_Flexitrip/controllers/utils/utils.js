function generateRandomCode(length = 20) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}



/**
 * Fonction pour envoyer un email
 * @param {string} to - L'adresse email du destinataire
 * @param {string} subject - L'objet de l'email
 * @param {string} text - Le contenu de l'email
 */
async function sendEmail(to, subject, text) {
    // Configuration du transporteur
    let transporter = nodemailer.createTransport({
        service: 'gmail', // Utilisez le service de votre choix, ici Gmail
        auth: {
            user: 'votre_email@gmail.com', // Remplacez par votre adresse email
            pass: 'votre_mot_de_passe' // Remplacez par votre mot de passe ou utilisez un mot de passe d'application
        }
    });

    // Options de l'email
    let mailOptions = {
        from: 'votre_email@gmail.com', // Remplacez par votre adresse email
        to: to,
        subject: subject,
        text: text
    };

    try {
        // Envoi de l'email
        await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
    }
}


module.exports = { generateRandomCode };