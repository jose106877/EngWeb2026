/*
 * data.js
 * Data is injected server-side by Pug into window globals.
 * This file normalizes the public payload for the feature modules.
 */

const DEFAULT_MEMBER_COLORS = ["#efe6d3", "#6a5840"];
const MEMBER_COLORS = [
  ["#f3e8d8", "#6c5736"],
  ["#e6edf6", "#3f5977"],
  ["#e8f2ea", "#3f6b4f"],
  ["#efe7f6", "#5c4b7a"],
  ["#f6ece4", "#845438"],
  ["#e8f0f2", "#4e6670"],
];

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const DEPARTMENT_CARGO_HINTS = {
  presidencia: ["presidente", "presidencia"],
  "departamento de apoio ao aluno": ["dapa", "apoio ao aluno"],
  "departamento de acoes de voluntariado e educativas": [
    "dave",
    "voluntariado",
    "educativas",
  ],
  "departamento cultural e desportivo": ["dcd", "cultural", "desportivo"],
  "departamento de comunicacao, imagem e marketing": [
    "dcim",
    "comunicacao",
    "imagem",
    "marketing",
  ],
  "departamento pedagogico": ["dp", "pedagog"],
  "mesa da assembleia geral": ["mag", "assembleia geral"],
  "conselho fiscal e jurisdicional": ["cfj", "fiscal", "jurisdicional"],
};

const normalizePessoaPhoto = (photoValue) => {
  if (!photoValue) return null;
  if (/^(https?:)?\/\//i.test(photoValue) || photoValue.startsWith("/media/")) {
    return photoValue;
  }
  return `/media/pessoas/${photoValue}`;
};

const normalizeAssetPath = (value, fallbackPrefix = "") => {
  const content = String(value || "").trim();
  if (!content) return null;
  if (
    /^(https?:)?\/\//i.test(content) ||
    content.startsWith("/media/") ||
    content.startsWith("/download/")
  ) {
    return content;
  }
  if (!fallbackPrefix) return content;
  return `${fallbackPrefix.replace(/\/$/, "")}/${content.replace(/^\//, "")}`;
};

const allPessoas = (window.pessoas || []).map((pessoa) => {
  const nomeCompleto =
    pessoa.nomeCompleto ||
    [pessoa.nome, pessoa.apelido].filter(Boolean).join(" ") ||
    pessoa.nome ||
    pessoa.id ||
    pessoa._id;

  return {
    ...pessoa,
    nomeCompleto,
    foto: normalizePessoaPhoto(pessoa.foto),
  };
});

const pessoasById = new Map(
  allPessoas.flatMap((pessoa) => {
    const pairs = [];
    if (pessoa.id) pairs.push([String(pessoa.id), pessoa]);
    if (pessoa._id) pairs.push([String(pessoa._id), pessoa]);
    return pairs;
  }),
);

const allActivities = (window.activities || []).map((activity) => ({
  ...activity,
  permalink: activity.link,
  highlightTitle: activity.nome_destaque || activity.titulo,
  highlightImage: normalizeAssetPath(activity.imagem_destaque, "/media/atividades"),
}));

const activitiesById = new Map(
  allActivities.flatMap((activity) => {
    const pairs = [];
    if (activity.id) pairs.push([String(activity.id), activity]);
    if (activity._id) pairs.push([String(activity._id), activity]);
    return pairs;
  }),
);

const allRegulations = (window.regulations || []).map((regulation) => ({
  ...regulation,
  link: normalizeAssetPath(regulation.link, "/download/documentos"),
}));

const regulationsById = new Map(
  allRegulations.flatMap((regulation) => {
    const pairs = [];
    if (regulation.id) pairs.push([String(regulation.id), regulation]);
    if (regulation._id) pairs.push([String(regulation._id), regulation]);
    return pairs;
  }),
);

const inferMembersByDepartmentName = (departmentName) => {
  const normalizedName = normalizeText(departmentName);
  const hints = DEPARTMENT_CARGO_HINTS[normalizedName] || [normalizedName];

  return allPessoas.filter((pessoa) => {
    const cargo = normalizeText(pessoa.cargo);

    if (
      normalizedName === "presidencia" &&
      cargo.includes("antigo presidente")
    ) {
      return false;
    }

    return hints.some((hint) => hint && cargo.includes(hint));
  });
};

const resolvePessoaRef = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    return (
      pessoasById.get(String(value._id || "")) ||
      pessoasById.get(String(value.id || "")) ||
      null
    );
  }
  return pessoasById.get(String(value)) || null;
};

const dedupeMembers = (members) => {
  const seen = new Set();
  return members.filter((member) => {
    const key = String(member.personRef || member.id || member.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mapDepartmentMembers = (department) => {
  const explicitParticipants = Array.isArray(department.participantes)
    ? department.participantes
    : [];

  const membersFromParticipants = explicitParticipants
    .map((participant, index) => {
      const person = resolvePessoaRef(participant.pessoa);
      if (!person) return null;

      return {
        id: person.id || person._id,
        personRef: person._id || person.id,
        name: person.nomeCompleto,
        role: String(participant.cargo || person.cargo || "Membro").trim(),
        photo: person.foto || null,
        order: Number(participant.ordem ?? index),
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

  if (membersFromParticipants.length) {
    return dedupeMembers(membersFromParticipants);
  }

  const membersFromRefs = (Array.isArray(department.pessoas) ? department.pessoas : [])
    .map((personRef, index) => {
      const person = resolvePessoaRef(personRef);
      if (!person) return null;

      return {
        id: person.id || person._id,
        personRef: person._id || person.id,
        name: person.nomeCompleto,
        role: String(person.cargo || "Membro").trim(),
        photo: person.foto || null,
        order: index,
      };
    })
    .filter(Boolean);

  if (membersFromRefs.length) {
    return dedupeMembers(membersFromRefs);
  }

  return inferMembersByDepartmentName(department.nome).map((person, index) => ({
    id: person.id || person._id,
    personRef: person._id || person.id,
    name: person.nomeCompleto,
    role: String(person.cargo || "Membro").trim(),
    photo: person.foto || null,
    order: index,
  }));
};

const groupMembersByRole = (members) => {
  const groups = [];
  const seen = new Map();

  [...members]
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .forEach((member) => {
      const roleLabel = String(member.role || "Membros").trim() || "Membros";
      const roleKey = normalizeText(roleLabel) || "membros";

      if (!seen.has(roleKey)) {
        const group = { id: roleKey, label: roleLabel, members: [] };
        seen.set(roleKey, group);
        groups.push(group);
      }

      seen.get(roleKey).members.push(member);
    });

  return groups;
};

const mapDepartmentActivities = (department) =>
  (Array.isArray(department.atividades) ? department.atividades : [])
    .map((activityRef) => activitiesById.get(String(activityRef)))
    .filter(Boolean)
    .map((activity) => ({
      id: activity._id || activity.id,
      databaseId: activity._id,
      title: activity.titulo,
      permalink: activity.link,
      date: activity.data,
      highlightTitle: activity.highlightTitle,
      highlightImage: activity.highlightImage,
      carouselOrder: Number(activity.ordem_carrossel ?? 0),
      showInCarousel:
        activity.mostrar_no_carrossel === true ||
        activity.mostrar_no_carrossel === "true",
    }))
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

const mapDepartmentRegulations = (department) =>
  (Array.isArray(department.regulamentos) ? department.regulamentos : [])
    .map((regulationRef) => regulationsById.get(String(regulationRef)))
    .filter(Boolean)
    .map((regulation) => ({
      id: regulation._id || regulation.id,
      label: regulation.nome,
      href: regulation.link,
      year: regulation.ano,
    }));

const buildDepartmentGallery = (department, activities) => {
  const items = [...activities]
    .filter((activity) => activity.highlightImage)
    .sort((a, b) => {
      const orderDiff = Number(a.carouselOrder || 0) - Number(b.carouselOrder || 0);
      if (orderDiff !== 0) return orderDiff;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    })
    .map((activity, index) => ({
      id: `${department._id || department.id}-gallery-${activity.id || index}`,
      title: activity.highlightTitle || activity.title,
      image: activity.highlightImage,
      link: activity.permalink,
      order: index,
    }));

  if (items.length) return items;

  if (department.link_fundo) {
    return [
      {
        id: `${department._id || department.id}-background`,
        title: department.nome,
        image: normalizeAssetPath(department.link_fundo),
        link: null,
        order: 0,
      },
    ];
  }

  return [];
};

const allMappedDepartments = (window.departments || []).map((department) => {
  const members = mapDepartmentMembers(department);
  const activities = mapDepartmentActivities(department);
  const regulations = mapDepartmentRegulations(department);

  return {
    id: department._id || department.id,
    name: department.nome,
    role: department.descricao || "",
    peopleIds: members.map((member) => member.personRef).filter(Boolean),
    people: members.map((member) => member.name).filter(Boolean),
    members,
    memberGroups: groupMembersByRole(members),
    regulations,
    activities,
    gallery: buildDepartmentGallery(department, activities),
    backgroundImage: normalizeAssetPath(department.link_fundo),
    parteDaDirecao:
      department.parte_da_direcao === true ||
      department.parte_da_direcao === "true",
  };
});

window.allDepartments = allMappedDepartments;
window.departments = allMappedDepartments.filter((department) => department.parteDaDirecao);

window.teamDepartments = window.departments.map((department) => ({
  id: department.id,
  key: department.id,
  label: department.name,
  note: department.role || "",
  members: department.members.map((member, index) => {
    const colors =
      MEMBER_COLORS[index % MEMBER_COLORS.length] || DEFAULT_MEMBER_COLORS;

    return {
      name: member.name || "Membro",
      role: member.role || "Membro",
      colors,
      photo: member.photo || null,
    };
  }),
}));

window.activityFilters = [
  { id: "all", name: "Todos" },
  ...allMappedDepartments
    .filter((department) => department.activities.length > 0)
    .map((department) => ({
      id: department.id,
      name: department.name,
    })),
];

window.posts = window.posts || [];
