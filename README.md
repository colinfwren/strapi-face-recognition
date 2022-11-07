# Strapi Face Recognition
This project uses PostgreSQL's `cube` type and `face-api.js` to find faces in the images uploaded to Strapi and create `Face` records for them.

This allows the `Face` content type to used in queries to return content that contains that face (e.g. a list of pages that contain images for a person)

## Important
> This project is a proof-of-concept and as such will only work with a PostgreSQL backend

## Setting up DB
Strapi doesn't configure PostgreSQL databases as part of the project generation so this needs to be done yourself.

In PostgreSQL use the following (change `mydb`, `myuser`, `mypass` to your preferred values)
```
create database mydb;
create user myuser with encrypted password 'mypass';
grant all privileges on database mydb to myuser;
alter DATABASE mydb OWNER TO admin;
```

## How it works

- When bootstrapping the `face-recognition` plugin the `vectors` table which stores the raw face descriptions is created
- A lifecycle listener is also set up that gets called when media is created (updated & deleted coming soon). This is used to detect and get the face descriptions for storage
- Once a face has been found and the descriptions generated, these are stored in the `vectors` table
- The vectors table has a link to the image ID

## How it will work (when I get round to further development)
- A property - `face_id` is used to link the vector to a specific `Face` entry and that `Face` in turn is linked to the created media
- The media uploader has been extended to help with the tagging of `Face`s
- As more and more media is added the `vectors` table is used to suggest faces

## Testing it
- Set up PostgreSQL database as above
- Git clone the project and install the deps
- Update the `config/database.js` values to ensure that can connect to DB
- Run `yarn develop` (or use npm) to run the server (this will create the `vectors` table)
- Once strapi is set up and you've created admin account the upload functionality should be ready (uploaded images will take longer if face detected)
- In order to use the `faces/searches` endpoint you will need to enable the public role for the searches endpoint, this is done under `Settings > Roles > Public > Face-recognition` and checking `search`
- you can then `POST` an image (use form-data and `file` as field name) to `http://localhost:1337/api/faces/searches` and it will return all matching faces

