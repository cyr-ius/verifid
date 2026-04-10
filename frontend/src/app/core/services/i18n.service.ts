import { DOCUMENT } from "@angular/common";
import { effect, inject, Injectable, signal } from "@angular/core";

const translations = {
  fr: {
    "app.title": "Verif'ID - Portail Entreprise",
    "brand.portal": "Verified ID Portal",
    "brand.short": "Verif'ID",
    "nav.toggle": "Basculer la navigation",
    "nav.verify": "Verification",
    "nav.assist": "Assistance",
    "nav.issue": "Emission (HR)",
    "nav.login": "Se connecter",
    "nav.logout": "Se deconnecter",
    "nav.me": "Mon acces",
    "nav.language": "Langue",
    "footer.product": "Microsoft Entra Verified ID",
    "route.verify": "Verification d'identite - Helpdesk",
    "route.assist": "Dashboard assistance - Helpdesk",
    "route.me": "Mon acces - Diagnostic token",
    "route.issue": "Emettre un credential - RH",
    "lang.fr": "Francais",
    "lang.en": "English",
    "lang.es": "Espanol",
    "issuance.title": "Emettre un credential salarie",
    "issuance.subtitle":
      "Remplissez les informations du salarie. Un QR code sera genere pour qu'il enregistre son credential dans Microsoft Authenticator.",
    "issuance.card.title": "Inscription",
    "issuance.employeeId": "Matricule salarie *",
    "issuance.employeeIdPlaceholder": "EMP-00123",
    "issuance.givenName": "Prenom *",
    "issuance.givenNamePlaceholder": "Jean",
    "issuance.familyName": "Nom *",
    "issuance.familyNamePlaceholder": "Dupont",
    "issuance.jobTitle": "Poste *",
    "issuance.jobTitlePlaceholder": "Developpeur senior",
    "issuance.department": "Departement *",
    "issuance.departmentPlaceholder": "Informatique",
    "issuance.submit": "Emettre le credential",
    "issuance.loading": "Creation de la demande d'emission...",
    "issuance.qrTitle": "QR Code d'enrolement",
    "issuance.qrAlt": "QR Code emission",
    "issuance.mobileLink": "Lien mobile",
    "issuance.instructions": "Instructions",
    "issuance.step1": "Montrez ce QR code ou envoyez-lui le lien mobile.",
    "issuance.step2":
      "Ouvrez Microsoft Authenticator et scannez le code.",
    "issuance.step3":
      "Le salarie accepte la reception du credential Employe verifie.",
    "issuance.step4":
      "Le credential est maintenant stocke dans son wallet et peut etre presente au helpdesk.",
    "issuance.reset": "Emettre un autre credential",
    "issuance.error":
      "Impossible de creer la demande d'emission. Veuillez reessayer.",
    "verification.title": "Verification d'identite",
    "verification.subtitle":
      "Saisissez le code communique par le helpdesk, puis scannez le QR code avec Microsoft Authenticator.",
    "verification.codeEntry": "Saisie du code",
    "verification.codeHelp":
      "Saisissez le code a 4 chiffres que le helpdesk vous a communique oralement.",
    "verification.codeAria": "Code d'assistance a 4 chiffres",
    "verification.continue": "Continuer",
    "verification.loadingHint": "Chargement...",
    "verification.loading": "Generation du QR code...",
    "verification.qrTitle": "QR Code de verification",
    "verification.qrAlt": "QR Code Verified ID",
    "verification.openPhone": "Ouvrir sur ce telephone",
    "verification.waiting": "En attente de la confirmation...",
    "verification.cancel": "Annuler",
    "verification.instructions": "Instructions",
    "verification.step1":
      "Ouvrez Microsoft Authenticator sur votre smartphone.",
    "verification.step2a":
      "Vous etes sur le meme telephone que celui ou Microsoft Authenticator est installe ? Appuyez sur le bouton Ouvrir sur ce telephone. Microsoft Authenticator devrait ouvrir directement vos identites numeriques.",
    "verification.step2b":
      "Vous etes sur un autre appareil. Lancez Microsoft Authenticator sur votre smartphone, selectionnez l'option Scanner un QR code puis scannez le QR code affiche a gauche.",
    "verification.step3":
      "Selectionnez votre identite numerique Employe verifie dans Microsoft Authenticator.",
    "verification.step4": "Confirmez le partage.",
    "verification.successTitle": "Identite presentee avec succes",
    "verification.successBody":
      "Votre credential a ete presente avec succes. Le helpdesk peut maintenant confirmer votre identite.",
    "verification.new": "Nouvelle verification",
    "verification.error.code": "Veuillez saisir un code a 4 chiffres.",
    "verification.error.notFound":
      "Code introuvable ou deja utilise. Demandez un nouveau code au helpdesk.",
    "verification.error.failed": "Verification echouee.",
    "verification.error.communication":
      "Erreur de communication. Veuillez reessayer.",
    "assist.title": "Dashboard assistance",
    "assist.subtitle":
      "Generez un code d'assistance a communiquer oralement a votre interlocuteur. La page se met a jour automatiquement une fois la verification effectuee.",
    "assist.ready": "Pret a verifier",
    "assist.readyBody":
      "Cliquez sur le bouton pour generer un code de verification a transmettre au salarie.",
    "assist.start": "Demarrer une verification",
    "assist.loadingHint": "Chargement...",
    "assist.loading": "Creation de la session...",
    "assist.codeCard": "Code a communiquer",
    "assist.codeLabel": "Code d'assistance",
    "assist.codeHint": "Communiquez ce code a votre interlocuteur",
    "assist.waiting": "En attente de la verification...",
    "assist.cancel": "Annuler",
    "assist.instructions": "Instructions",
    "assist.step1":
      "Invitez votre interlocuteur a se connecter au portail {portalUrl}.",
    "assist.step2":
      "Communiquez oralement le code {code}.",
    "assist.step3":
      "Votre interlocuteur saisit ce code sur le portail VerifID (/verify).",
    "assist.step4":
      "Il scanne le QR code genere avec Microsoft Authenticator ou appuie sur le bouton Ouvrir sur ce telephone s'il est sur le meme appareil.",
    "assist.step5":
      "Les informations verifiees s'affichent automatiquement sur cette page.",
    "assist.successTitle": "Identite verifiee avec succes",
    "assist.verifiedPerson": "Personne verifiee",
    "assist.notProvided": "Non renseigne",
    "assist.new": "Nouvelle verification",
    "assist.errorTitle": "Erreur",
    "assist.retry": "Reessayer",
    "assist.error.create":
      "Impossible de creer la session de verification. Veuillez reessayer.",
    "assist.error.failed": "La verification a echoue.",
    "assist.error.communication":
      "Erreur de communication avec le serveur. Veuillez reessayer.",
    "assist.status.success": "Verification reussie",
    "assist.status.waiting": "En attente",
    "assist.status.error": "Echec de verification",
    "assist.status.expired": "Code expire",
    "assist.status.unknown": "Statut inconnu",
    "claim.given_name": "Prenom",
    "claim.family_name": "Nom",
    "claim.employee_id": "Identifiant employe",
    "claim.job_title": "Poste",
    "claim.department": "Departement",
    "auth.title": "Mon acces",
    "auth.subtitle":
      "Cette page appelle /api/v1/status/me et affiche exactement ce que le backend recoit dans votre token Entra ID.",
    "auth.refresh": "Rafraichir",
    "auth.loading": "Lecture du token en cours...",
    "auth.errorTitle": "Impossible de lire le token",
    "auth.error.fetch":
      "Impossible de recuperer les informations du token.",
    "auth.user": "Utilisateur",
    "auth.roles": "Roles",
    "auth.noValue": "Non renseigne",
    "auth.noRoles": "Aucun role dans le token",
    "auth.scopes": "Scopes",
    "auth.noScopes": "Aucun scope dans le token",
    "auth.audience": "Audience",
    "auth.issuer": "Issuer",
    "auth.rawTitle": "Payload brut du token",
    "auth.rawHelp":
      "Copiez ces informations si vous voulez que je verifie les droits avec vous.",
  },
  en: {
    "app.title": "Verif'ID - Enterprise Portal",
    "brand.portal": "Verif'ID Portal",
    "brand.short": "Verif'ID",
    "nav.toggle": "Toggle navigation",
    "nav.verify": "Verification",
    "nav.assist": "Assistance",
    "nav.issue": "Issuance (HR)",
    "nav.login": "Sign in",
    "nav.logout": "Sign out",
    "nav.me": "My access",
    "nav.language": "Language",
    "footer.product": "Microsoft Entra Verified ID",
    "route.verify": "Identity verification - Helpdesk",
    "route.assist": "Assistance dashboard - Helpdesk",
    "route.me": "My access - Token diagnostics",
    "route.issue": "Issue a credential - HR",
    "lang.fr": "French",
    "lang.en": "English",
    "lang.es": "Spanish",
    "issuance.title": "Issue an employee credential",
    "issuance.subtitle":
      "Fill in the employee information. A QR code will be generated so they can store their credential in Microsoft Authenticator.",
    "issuance.card.title": "Registration",
    "issuance.employeeId": "Employee ID *",
    "issuance.employeeIdPlaceholder": "EMP-00123",
    "issuance.givenName": "First name *",
    "issuance.givenNamePlaceholder": "John",
    "issuance.familyName": "Last name *",
    "issuance.familyNamePlaceholder": "Doe",
    "issuance.jobTitle": "Job title *",
    "issuance.jobTitlePlaceholder": "Senior Developer",
    "issuance.department": "Department *",
    "issuance.departmentPlaceholder": "Engineering",
    "issuance.submit": "Issue credential",
    "issuance.loading": "Creating the issuance request...",
    "issuance.qrTitle": "Enrollment QR code",
    "issuance.qrAlt": "Issuance QR code",
    "issuance.mobileLink": "Mobile link",
    "issuance.instructions": "Instructions",
    "issuance.step1": "Show this QR code or send the mobile link.",
    "issuance.step2":
      "Open Microsoft Authenticator and scan the code.",
    "issuance.step3":
      "The employee accepts the Verified Employee credential.",
    "issuance.step4":
      "The credential is now stored in the wallet and can be presented to the helpdesk.",
    "issuance.reset": "Issue another credential",
    "issuance.error":
      "Unable to create the issuance request. Please try again.",
    "verification.title": "Identity verification",
    "verification.subtitle":
      "Enter the code provided by the helpdesk, then scan the QR code with Microsoft Authenticator.",
    "verification.codeEntry": "Code entry",
    "verification.codeHelp":
      "Enter the 4-digit code verbally provided by the helpdesk.",
    "verification.codeAria": "4-digit assistance code",
    "verification.continue": "Continue",
    "verification.loadingHint": "Loading...",
    "verification.loading": "Generating the QR code...",
    "verification.qrTitle": "Verification QR code",
    "verification.qrAlt": "Verified ID QR code",
    "verification.openPhone": "Open on this phone",
    "verification.waiting": "Waiting for confirmation...",
    "verification.cancel": "Cancel",
    "verification.instructions": "Instructions",
    "verification.step1":
      "Open Microsoft Authenticator on your smartphone.",
    "verification.step2a":
      "Are you on the same phone where Microsoft Authenticator is installed? Tap Open on this phone. Microsoft Authenticator should open your digital identities directly.",
    "verification.step2b":
      "Are you on another device? Open Microsoft Authenticator on your smartphone, choose Scan a QR code, then scan the QR code shown on the left.",
    "verification.step3":
      "Select your Verified Employee digital identity in Microsoft Authenticator.",
    "verification.step4": "Confirm the sharing request.",
    "verification.successTitle": "Identity presented successfully",
    "verification.successBody":
      "Your credential was presented successfully. The helpdesk can now confirm your identity.",
    "verification.new": "New verification",
    "verification.error.code": "Please enter a 4-digit code.",
    "verification.error.notFound":
      "Code not found or already used. Ask the helpdesk for a new code.",
    "verification.error.failed": "Verification failed.",
    "verification.error.communication":
      "Communication error. Please try again.",
    "assist.title": "Assistance dashboard",
    "assist.subtitle":
      "Generate an assistance code to share verbally with your contact. The page updates automatically once verification is completed.",
    "assist.ready": "Ready to verify",
    "assist.readyBody":
      "Click the button to generate a verification code to share with the employee.",
    "assist.start": "Start verification",
    "assist.loadingHint": "Loading...",
    "assist.loading": "Creating the session...",
    "assist.codeCard": "Code to share",
    "assist.codeLabel": "Assistance code",
    "assist.codeHint": "Share this code with your contact",
    "assist.waiting": "Waiting for verification...",
    "assist.cancel": "Cancel",
    "assist.instructions": "Instructions",
    "assist.step1":
      "Ask your contact to open the portal at {portalUrl}.",
    "assist.step2": "Read the code {code} out loud.",
    "assist.step3":
      "Your contact enters this code on the VerifID portal (/verify).",
    "assist.step4":
      "They scan the generated QR code with Microsoft Authenticator or tap Open on this phone if they are on the same device.",
    "assist.step5":
      "Verified information is displayed automatically on this page.",
    "assist.successTitle": "Identity verified successfully",
    "assist.verifiedPerson": "Verified person",
    "assist.notProvided": "Not provided",
    "assist.new": "New verification",
    "assist.errorTitle": "Error",
    "assist.retry": "Try again",
    "assist.error.create":
      "Unable to create the verification session. Please try again.",
    "assist.error.failed": "Verification failed.",
    "assist.error.communication":
      "Communication error with the server. Please try again.",
    "assist.status.success": "Verification successful",
    "assist.status.waiting": "Waiting",
    "assist.status.error": "Verification failed",
    "assist.status.expired": "Code expired",
    "assist.status.unknown": "Unknown status",
    "claim.given_name": "First name",
    "claim.family_name": "Last name",
    "claim.employee_id": "Employee ID",
    "claim.job_title": "Job title",
    "claim.department": "Department",
    "auth.title": "My access",
    "auth.subtitle":
      "This page calls /api/v1/status/me and shows exactly what the backend receives in your Entra ID token.",
    "auth.refresh": "Refresh",
    "auth.loading": "Reading token...",
    "auth.errorTitle": "Unable to read the token",
    "auth.error.fetch":
      "Unable to retrieve token information.",
    "auth.user": "User",
    "auth.roles": "Roles",
    "auth.noValue": "Not provided",
    "auth.noRoles": "No role found in the token",
    "auth.scopes": "Scopes",
    "auth.noScopes": "No scope found in the token",
    "auth.audience": "Audience",
    "auth.issuer": "Issuer",
    "auth.rawTitle": "Raw token payload",
    "auth.rawHelp":
      "Copy this information if you want me to help review the permissions with you.",
  },
  es: {
    "app.title": "Verif'ID - Portal Empresarial",
    "brand.portal": "Portal de Verif'ID",
    "brand.short": "Verif'ID",
    "nav.toggle": "Cambiar navegacion",
    "nav.verify": "Verificacion",
    "nav.assist": "Asistencia",
    "nav.issue": "Emision (RR. HH.)",
    "nav.login": "Iniciar sesion",
    "nav.logout": "Cerrar sesion",
    "nav.me": "Mi acceso",
    "nav.language": "Idioma",
    "footer.product": "Microsoft Entra Verified ID",
    "route.verify": "Verificacion de identidad - Helpdesk",
    "route.assist": "Panel de asistencia - Helpdesk",
    "route.me": "Mi acceso - Diagnostico del token",
    "route.issue": "Emitir una credencial - RR. HH.",
    "lang.fr": "Frances",
    "lang.en": "Ingles",
    "lang.es": "Espanol",
    "issuance.title": "Emitir una credencial de empleado",
    "issuance.subtitle":
      "Complete la informacion del empleado. Se generara un codigo QR para que guarde su credencial en Microsoft Authenticator.",
    "issuance.card.title": "Registro",
    "issuance.employeeId": "Identificador del empleado *",
    "issuance.employeeIdPlaceholder": "EMP-00123",
    "issuance.givenName": "Nombre *",
    "issuance.givenNamePlaceholder": "Juan",
    "issuance.familyName": "Apellido *",
    "issuance.familyNamePlaceholder": "Garcia",
    "issuance.jobTitle": "Puesto *",
    "issuance.jobTitlePlaceholder": "Desarrollador senior",
    "issuance.department": "Departamento *",
    "issuance.departmentPlaceholder": "Informatica",
    "issuance.submit": "Emitir credencial",
    "issuance.loading": "Creando la solicitud de emision...",
    "issuance.qrTitle": "Codigo QR de registro",
    "issuance.qrAlt": "Codigo QR de emision",
    "issuance.mobileLink": "Enlace movil",
    "issuance.instructions": "Instrucciones",
    "issuance.step1": "Muestre este codigo QR o envie el enlace movil.",
    "issuance.step2":
      "Abra Microsoft Authenticator y escanee el codigo.",
    "issuance.step3":
      "El empleado acepta la recepcion de la credencial Empleado verificado.",
    "issuance.step4":
      "La credencial ahora esta almacenada en su wallet y puede presentarse al helpdesk.",
    "issuance.reset": "Emitir otra credencial",
    "issuance.error":
      "No se pudo crear la solicitud de emision. Intente de nuevo.",
    "verification.title": "Verificacion de identidad",
    "verification.subtitle":
      "Introduzca el codigo proporcionado por el helpdesk y luego escanee el codigo QR con Microsoft Authenticator.",
    "verification.codeEntry": "Ingreso del codigo",
    "verification.codeHelp":
      "Introduzca el codigo de 4 digitos comunicado verbalmente por el helpdesk.",
    "verification.codeAria": "Codigo de asistencia de 4 digitos",
    "verification.continue": "Continuar",
    "verification.loadingHint": "Cargando...",
    "verification.loading": "Generando el codigo QR...",
    "verification.qrTitle": "Codigo QR de verificacion",
    "verification.qrAlt": "Codigo QR de Verified ID",
    "verification.openPhone": "Abrir en este telefono",
    "verification.waiting": "Esperando confirmacion...",
    "verification.cancel": "Cancelar",
    "verification.instructions": "Instrucciones",
    "verification.step1":
      "Abra Microsoft Authenticator en su smartphone.",
    "verification.step2a":
      "Esta en el mismo telefono donde esta instalado Microsoft Authenticator? Pulse Abrir en este telefono. Microsoft Authenticator deberia abrir directamente sus identidades digitales.",
    "verification.step2b":
      "Esta en otro dispositivo? Abra Microsoft Authenticator en su smartphone, seleccione Escanear un codigo QR y luego escanee el codigo QR mostrado a la izquierda.",
    "verification.step3":
      "Seleccione su identidad digital Empleado verificado en Microsoft Authenticator.",
    "verification.step4": "Confirme el uso compartido.",
    "verification.successTitle": "Identidad presentada correctamente",
    "verification.successBody":
      "Su credencial se presento correctamente. El helpdesk ya puede confirmar su identidad.",
    "verification.new": "Nueva verificacion",
    "verification.error.code": "Introduzca un codigo de 4 digitos.",
    "verification.error.notFound":
      "Codigo no encontrado o ya utilizado. Solicite un nuevo codigo al helpdesk.",
    "verification.error.failed": "La verificacion ha fallado.",
    "verification.error.communication":
      "Error de comunicacion. Intente de nuevo.",
    "assist.title": "Panel de asistencia",
    "assist.subtitle":
      "Genere un codigo de asistencia para comunicarlo verbalmente a su interlocutor. La pagina se actualiza automaticamente una vez completada la verificacion.",
    "assist.ready": "Listo para verificar",
    "assist.readyBody":
      "Pulse el boton para generar un codigo de verificacion para el empleado.",
    "assist.start": "Iniciar verificacion",
    "assist.loadingHint": "Cargando...",
    "assist.loading": "Creando la sesion...",
    "assist.codeCard": "Codigo para comunicar",
    "assist.codeLabel": "Codigo de asistencia",
    "assist.codeHint": "Comunique este codigo a su interlocutor",
    "assist.waiting": "Esperando la verificacion...",
    "assist.cancel": "Cancelar",
    "assist.instructions": "Instrucciones",
    "assist.step1":
      "Pida a su interlocutor que abra el portal en {portalUrl}.",
    "assist.step2":
      "Comunique verbalmente el codigo {code}.",
    "assist.step3":
      "Su interlocutor introduce este codigo en el portal VerifID (/verify).",
    "assist.step4":
      "Escanea el codigo QR generado con Microsoft Authenticator o pulsa Abrir en este telefono si esta en el mismo dispositivo.",
    "assist.step5":
      "La informacion verificada se muestra automaticamente en esta pagina.",
    "assist.successTitle": "Identidad verificada correctamente",
    "assist.verifiedPerson": "Persona verificada",
    "assist.notProvided": "No informado",
    "assist.new": "Nueva verificacion",
    "assist.errorTitle": "Error",
    "assist.retry": "Reintentar",
    "assist.error.create":
      "No se pudo crear la sesion de verificacion. Intente de nuevo.",
    "assist.error.failed": "La verificacion ha fallado.",
    "assist.error.communication":
      "Error de comunicacion con el servidor. Intente de nuevo.",
    "assist.status.success": "Verificacion correcta",
    "assist.status.waiting": "En espera",
    "assist.status.error": "Fallo de verificacion",
    "assist.status.expired": "Codigo caducado",
    "assist.status.unknown": "Estado desconocido",
    "claim.given_name": "Nombre",
    "claim.family_name": "Apellido",
    "claim.employee_id": "Identificador del empleado",
    "claim.job_title": "Puesto",
    "claim.department": "Departamento",
    "auth.title": "Mi acceso",
    "auth.subtitle":
      "Esta pagina llama a /api/v1/status/me y muestra exactamente lo que el backend recibe en su token de Entra ID.",
    "auth.refresh": "Actualizar",
    "auth.loading": "Leyendo token...",
    "auth.errorTitle": "No se pudo leer el token",
    "auth.error.fetch":
      "No se pudo recuperar la informacion del token.",
    "auth.user": "Usuario",
    "auth.roles": "Roles",
    "auth.noValue": "No informado",
    "auth.noRoles": "No hay roles en el token",
    "auth.scopes": "Scopes",
    "auth.noScopes": "No hay scopes en el token",
    "auth.audience": "Audiencia",
    "auth.issuer": "Issuer",
    "auth.rawTitle": "Payload bruto del token",
    "auth.rawHelp":
      "Copie esta informacion si quiere que revisemos juntos los permisos.",
  },
} as const;

export type AppLanguage = keyof typeof translations;
type TranslationKey = keyof (typeof translations)["fr"];

@Injectable({ providedIn: "root" })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = "verifid.language";
  private readonly defaultLanguage: AppLanguage = "en";

  readonly currentLanguage = signal<AppLanguage>(this.getInitialLanguage());
  readonly availableLanguages: ReadonlyArray<AppLanguage> = ["fr", "en", "es"];

  constructor() {
    effect(() => {
      const language = this.currentLanguage();
      this.document.documentElement.lang = language;
      localStorage.setItem(this.storageKey, language);
    });
  }

  setLanguage(language: AppLanguage): void {
    this.currentLanguage.set(language);
  }

  resolveLanguage(value: string | null | undefined): AppLanguage {
    if (value === "fr" || value === "en" || value === "es") {
      return value;
    }
    return this.defaultLanguage;
  }

  preferredLanguage(): AppLanguage {
    const saved = this.readSavedLanguage();
    if (saved) {
      return saved;
    }
    return this.detectBrowserLanguage();
  }

  t(
    key: TranslationKey,
    params?: Record<string, string | number | null | undefined>,
  ): string {
    const language = this.currentLanguage();
    const dictionary = translations[language];
    const fallback = translations.fr;
    let value: string = dictionary[key] ?? fallback[key] ?? key;

    if (!params) {
      return value;
    }

    for (const [paramKey, paramValue] of Object.entries(params)) {
      value = value.replaceAll(`{${paramKey}}`, String(paramValue ?? ""));
    }

    return value;
  }

  private getInitialLanguage(): AppLanguage {
    return this.preferredLanguage();
  }

  private readSavedLanguage(): AppLanguage | null {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === "fr" || saved === "en" || saved === "es") {
      return saved;
    }
    return null;
  }

  private detectBrowserLanguage(): AppLanguage {
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith("fr")) {
      return "fr";
    }
    if (browserLanguage.startsWith("es")) {
      return "es";
    }
    return this.defaultLanguage;
  }
}
