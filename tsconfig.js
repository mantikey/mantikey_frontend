{
  "include": ["src", "global.d.ts"],
    "extends": "./.nuxt/tsconfig.json",
    "compilerOptions": {
      "strict": true,
      "paths": {
        "#imports": [".nuxt/imports.d.ts"],
      }
    }
  }