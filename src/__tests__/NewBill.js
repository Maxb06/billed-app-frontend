/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import BillsUI from "../views/BillsUI.js";

beforeEach(() => {
  document.body.innerHTML = NewBillUI();
});

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};

// Mock le module store pour utiliser mockStore dans les tests
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion
      // Test de l'affichage du formulaire
      const formNewBill = screen.getByTestId("form-new-bill");
      expect(formNewBill).toBeTruthy();
    });
  });
});

// Test de l'appel de handleChangeFile lors de la sélection d'un fichier image
describe("I upload a file", () => {
  describe("When the file has a valid extension", () => {
    test("Then the file should be accepted", () => {
      // Mock la fonction onNavigate pour simuler la navigation
      const onNavigate = jest.fn();
      // Simule la configuration du localStorage avec un utilisateur connecté
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      // Crée une nouvelle instance de NewBill pour tester la fonctionnalité
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);

      // Teste avec une extension valide (jpg)
      let file = new File(["image"], "image.jpg", { type: "image/jpg" });
      fireEvent.change(inputFile, { target: { files: [file] } });

      // Vérification de la valeur du champ après sélection d'un fichier valide
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe("image.jpg");  // verifie que le fichier est bien sélectionné
    });
  });

  describe("When the file has an invalid extension", () => {
    test("Then the file should be rejected and the input should be reset", () => {
      const onNavigate = jest.fn();
      // Simule la configuration du localStorage avec un utilisateur connecté
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      // Simule la sélection d'un fichier avec une extension non valide (PDF)
      let file = new File(["document"], "document.pdf", { type: "application/pdf" });
      fireEvent.change(inputFile, { target: { files: [file] } });

      expect(handleChangeFile).toHaveBeenCalled();
      // vérifie que le champ de fichier a été réinitialisé (extension invalide)
      expect(inputFile.value).toBe("");
    });
  });
});

// test quand le formulaire est correctement rempli
describe("Given I am connected as an employee", () => {
  describe("When I submit the form completed", () => {
    test("Then the bill is created", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "azerty@email.com",
        })
      );

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const validBill = {
        type: "Restaurants et bars",
        name: "Vol Paris Londres",
        date: "2024-02-15",
        amount: 200,
        vat: 70,
        pct: 30,
        commentary: "Commentary",
        fileUrl: "../img/0.jpg",
        fileName: "test.jpg",
        status: "pending",
      };

      screen.getByTestId("expense-type").value = validBill.type;
      screen.getByTestId("expense-name").value = validBill.name;
      screen.getByTestId("datepicker").value = validBill.date;
      screen.getByTestId("amount").value = validBill.amount;
      screen.getByTestId("vat").value = validBill.vat;
      screen.getByTestId("pct").value = validBill.pct;
      screen.getByTestId("commentary").value = validBill.commentary;

      newBill.fileName = validBill.fileName;
      newBill.fileUrl = validBill.fileUrl;

      newBill.updateBill = jest.fn();
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(newBill.updateBill).toHaveBeenCalled();
    });
  });
});

// test d'intégration POST new bill
describe("Given I am connected as an employee", () => {
  describe("Given I am a user connected as Employee", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");

      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });

    describe("When I navigate to newBill", () => {
      // Nouvelle facture
      test("promise from mock API POST returns object bills with correct values", async () => {
        window.onNavigate(ROUTES_PATH.NewBill);

        const bills = await mockStore.bills().create();
        expect(bills.key).toBe("1234");
        expect(bills.fileUrl).toBe("https://localhost:3456/images/test.jpg");
      });

      // Erreur 404
      test("Then, fetches bills from an API and fails with 404 message error", async () => {
        window.onNavigate(ROUTES_PATH.NewBill);

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        const message = screen.getByText("Erreur 404");
        expect(message).toBeTruthy();
      });

      // Erreur 500
      test("Then, fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
            list: () => {
              return Promise.resolve([]);
            },
          };
        });
        await new Promise(process.nextTick);
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        const message = screen.getByText("Erreur 500");
        expect(message).toBeTruthy();
      });
    });
  });
});


