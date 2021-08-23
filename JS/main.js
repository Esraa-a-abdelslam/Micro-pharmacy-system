var db = openDatabase("Pharmacy", "1.0", "Pharmacy", 2 * 1024 * 1024);

$(function () {

    db.transaction(function (tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS Users (Id UNIQUE , Username , Password , IsAdmin)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS Items (Id UNIQUE , Name , Quantity , Picture)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS Invoice (Id UNIQUE , TransactionDate , CustomerName , Type , ItemName , Quantity)');


        tx.executeSql('INSERT INTO USERS (Id , Username , Password , IsAdmin) VALUES ("1" , "Admin" , "123" , TRUE )');

    });

    db.transaction(function (tx) {
        tx.executeSql('SELECT COUNT(Id) AS lastId FROM Users', [], function (tx, results) {
            localStorage.lastId = results.rows[0]['lastId'];
        })
    });

    db.transaction(function (tx) {
        tx.executeSql('SELECT COUNT(Id) AS lastItem FROM Items', [], function (tx, result) {
            localStorage.lastItem = result.rows[0]['lastItem'];
        })
    });

    db.transaction(function (tx) {
        tx.executeSql('SELECT COUNT(Id) AS lastInvoice FROM Invoice', [], function (tx, res) {
            localStorage.lastInvoice = res.rows[0]['lastInvoice'];
        })
    });


    if (sessionStorage.userId != null) {

        db.transaction(function (tx) {

            tx.executeSql(`SELECT Username
                           FROM Users
                           WHERE Id = ?`, [sessionStorage.userId], function (tx, results) {

                if (results.rows.length > 0) {
                    var user = results.rows[0]['Username'];
                    $('#navbarDropdownMenuControl').html(user);
                }

            })

        });


        db.transaction(function (tx) {

            tx.executeSql('SELECT IsAdmin FROM Users WHERE Id = ?', [sessionStorage.userId], function (tx, results) {

                if (results.rows.length > 0) {

                    var admin = results.rows[0]['IsAdmin'];

                    if (admin != 1) {

                        $('#navbarDropdownMenuUsers').hide();
                    }

                }

            })

        });

        db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM Items', [], function (tx, results) {
                if (results.rows.length == 0) {
                    $('#itemName').append('<option disabled>There is no Items</option>');
                } else {
                    $.each(results.rows, function (key, value) {
                        $('#itemName').append(`<option value="${value['Id']}" >${value['Name']}</option>`)
                    });
                }
            });
        });

        db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM Users', [], function (tx, res) {
                $.each(res.rows, function (key, value) {
                    if (value['IsAdmin'] != 1) {
                        $('#usersList').append(`<option value="${value['Id']}" > ${value['Username']} </option>`)
                    }
                })
            })
        })


    }

});


function changePassword() {

    var oldPsw = $('#oldPsw').val();
    var newPsw = $('#psw').val();
    var conNewPsw = $('#conPsw').val();
    var current = sessionStorage.userId;

    if (newPsw == conNewPsw) {

        db.transaction(function (tx) {
            tx.executeSql('SELECT Password FROM Users WHERE Id =? ', [sessionStorage.userId], function (tx, res) {
                //console.log(res);
                if (res.rows[0]["Password"] == oldPsw) {

                    var updateSql = 'Update Users SET Password = ? WHERE Id = ?';

                    tx.executeSql(updateSql, [newPsw, current], function () {
                        alert("your password has been changed successfully");
                        redirect('after_login.html');
                    });

                } else {
                    alert("wrong data");
                }
            })
        });

    } else {
        alert("Password and Confirm Password is not match!!");
    }
}


function login() {

    var username = $('#name').val();
    var pass = $('#password').val();


    db.transaction(function (tx) {

        tx.executeSql('SELECT Id FROM Users WHERE Username = ? AND Password = ?', [username, pass], function (tx, results) {

            var records = results.rows.length;

            if (records > 0) {

                sessionStorage.userId = results.rows[0]['Id'];
                redirect('after_login.html')

            } else {
                alert('not found');
            }

        })

    })
}


function addUser() {

    localStorage.lastId++;

    var name = $("#name").val();
    var pass = $("#password").val();
    db.transaction(function (transaction) {
        var sql = "INSERT INTO USERS (Id , Username , Password , IsAdmin) VALUES(?,?,?,?)";
        transaction.executeSql(sql, [localStorage.lastId, name, pass, 0], function () {
            alert("New user is added");
            redirect('after_login.html');
        }, function (transaction, err) {
            alert(err.message);
        })
    })
}

function logout() {
    sessionStorage.removeItem('userId');
    redirect('index.html');
}

function addItem() {
    var itemName = $('#itemName').val();
    var imgBase = sessionStorage.imgBase;

    db.transaction(function (tx) {

        localStorage.lastItem++;

        var sql = 'INSERT INTO Items (Id , Name , Quantity , Picture) VALUES (? , ? , ? , ?)';
        tx.executeSql(sql, [localStorage.lastItem, itemName, 0, imgBase], function () {
            alert('Item Added successfully');
            redirect('Items.html');
        })
    })
}

function takePic() {
    $('#taking').show();
}

function addTransaction() {

    var cstName = $('#cstName').val();
    var itemId = $('#itemName').val();
    var qty = $('#quantity').val();
    var type = $('#type').val();

    if(qty > 0){

        db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM Items WHERE Id = ? ', [itemId], function (tx, res) {

                var itemName = res.rows[0]["Name"];
                var itemQuantity = res.rows[0]["Quantity"];
                localStorage.lastInvoice++;

                var fullDate = getDate();

                if (type == 1) {

                    if (itemQuantity >= qty) {

                        insertToInvoice(localStorage.lastInvoice, fullDate, cstName, type, itemName, qty);
                        updateItemQuantity(Number(itemQuantity) - Number(qty), itemId);

                    } else {
                        alert("You don't have that quantity");
                    }

                } else if (type == 0) {

                    insertToInvoice(localStorage.lastInvoice, fullDate, cstName, type, itemName, qty);
                    updateItemQuantity(Number(qty) + Number(itemQuantity), itemId);

                } else {

                    alert("Wrong Data");
                }

            });
        });

    }else {
        alert("enter a valid Quantity");
    }

}


function deleteUser() {
    var userId = $('#usersList').val();

    db.transaction(function (tx) {
        tx.executeSql('DELETE FROM Users WHERE Id = ? ', [userId], function () {
            alert(`User Is Deleted!`);
        });
    });
}

function redirect(location) {
    window.location.href = location;
}


function getDate() {

    var d = new Date();
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();

    var fullDate = `${day} / ${month} / ${year}`;

    return fullDate;
}


function insertToInvoice(id, transDate, cstName, type, itemName, Q) {

    var insertSql = 'INSERT INTO Invoice (Id , TransactionDate , CustomerName , Type , ItemName , Quantity) VALUES (? , ? , ? , ? , ? , ?)';
    db.transaction(function (tx) {
        tx.executeSql(insertSql,
            [id, transDate, cstName, type, itemName, Q],
            function (tx, res) {
                console.log(res);
                alert('Transaction Added');
            });
    });
}


function updateItemQuantity(newQuantity, itemId) {

    var updateSql = 'UPDATE Items SET Quantity = ? WHERE Id = ?';

    db.transaction(function (tx) {
        tx.executeSql(updateSql,
            [newQuantity, itemId],
            function () {
                alert('Item Updated with transaction');
            });
    });

}





