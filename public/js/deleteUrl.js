async function deleteUrl(shortUrl) {
    const confirmation = confirm('Voulez-vous supprimer cet URL ?');
  
    if (!confirmation) return;
    try {
      // Construire l'URL complète pour la suppression
      const url = `/delete/${shortUrl}`;

      // Envoyer une requête DELETE à l'URL spécifiée
      const response = await fetch(url, {
          method: 'DELETE'
      });

      // Vérifier si la requête a réussi (statut 200 à 299)
      if (response.ok) {
          console.log('Suppression réussie');
           
          window.location.reload(); // Rafraîchit la page actuelle
      } else {
          console.error('La suppression a échoué');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'URL :', error);
    }
  }