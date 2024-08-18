/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

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


