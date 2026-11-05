import swaggerDocument from "../config/mountain-hut-swagger.json";

function addRolesToDescriptions(document: any) {
  for (const path of Object.values(document.paths) as any[]) {
    for (const operation of Object.values(path) as any[]) {

      if (!operation || typeof operation !== "object") continue;

      if (operation["x-roles"]) {
        const roles = operation["x-roles"].join(", ");

        operation.description =
          `${operation.description ?? ""}\n\n🔐 Allowed roles: ${roles}`;
      }
    }
  }

  return document;
}

export const swaggerConfig = addRolesToDescriptions(
  structuredClone(swaggerDocument)
);