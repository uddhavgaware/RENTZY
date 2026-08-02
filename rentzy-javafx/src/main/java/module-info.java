module com.rentzy.javafx {
    requires javafx.controls;
    requires javafx.fxml;
    requires javafx.graphics;
    requires com.fasterxml.jackson.databind;
    requires com.fasterxml.jackson.datatype.jsr310;
    requires java.net.http;

    opens com.rentzy.javafx to javafx.fxml;
    opens com.rentzy.javafx.controller to javafx.fxml;
    opens com.rentzy.javafx.model to com.fasterxml.jackson.databind;

    exports com.rentzy.javafx;
    exports com.rentzy.javafx.controller;
    exports com.rentzy.javafx.model;
    exports com.rentzy.javafx.service;
}
