#!/bin/bash

mongosh aeeum --eval "
  const data = JSON.parse(fs.readFileSync('/docker-entrypoint-initdb.d/db.json', 'utf8'));

  // Insert all collections except departamentos, skip empty arrays
  ['users', 'pessoas', 'regulamentos', 'atividades', 'patrocinadores', 'a_nossa_historia', 'texto_solto'].forEach(name => 
  {
    if(data[name] && data[name].length > 0) 
    {
      db.getCollection(name).insertMany(data[name]);
      print('Inserted: ' + name);
    }else{
      print('Skipped (empty): ' + name);
    }
  });

  // Keep seed _id values as strings across collections and references.
  data.departamentos.forEach(dep => 
  {
    dep.pessoas = dep.pessoas.filter(_id => db.pessoas.findOne({_id}));
    dep.regulamentos = dep.regulamentos.filter(_id => db.regulamentos.findOne({_id}));
    dep.atividades = dep.atividades.filter(_id => db.atividades.findOne({_id}));
  });

  db.departamentos.insertMany(data.departamentos);
  print('Inserted: departamentos');
"
