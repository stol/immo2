===== Installation =====

- Installer les dépendances

        $ npm install

- Créer une BDD mysql "immo", user 'root' sans mdp. Si différent, éditer crawler.js et www/app.js avec les bonnes infos.

- Exécuter schema.sql pour générer le scheam de la BDD

===== Utilisation =====

- Editer crawler.js pour mettre les bonnes options (zone "CONFIGURATION" en haut)

- Lancer le crawler avec
    
    $ node crawler.js

- Lancer le server web 
    
    $ node www/app.js

- Aller sur http://localhost:3000 et .. have fun !