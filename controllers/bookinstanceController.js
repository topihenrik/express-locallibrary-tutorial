var BookInstance = require('../models/bookinstance');

const { body,validationResult } = require('express-validator');

var Book = require('../models/book');

var async = require('async');



// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {

    BookInstance.find()
      .populate('book')
      .exec(function (err, list_bookinstances) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
      });
  
  };
  

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: ' + bookinstance.book.title, bookinstance:  bookinstance});
    })

};


// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {

    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });

};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate and sanitize fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) {
    async.parallel({
        bookinstance(callback) {
            BookInstance.findById(req.params.id).exec(callback)
        },
    }, function(err, results) {
        if(err) {
            return next(err);
        }
        if (results.bookinstance==null) { // No results
            res.redirect("/catalog/bookinstances");
        }
        // Succesful, so render
        res.render("bookinstance_delete", { title: "Delete Book Instance", bookinstance: results.bookinstance});
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
    async.parallel({
        bookinstance(callback) {
            BookInstance.findById(req.body.bookinstanceid).exec(callback)
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        // Success
        BookInstance.findByIdAndDelete(req.body.bookinstanceid, function deleteBookInstance(err) {
            if (err) {
                return next(err);
            }
            // Success - go to book instance list
            res.redirect("/catalog/bookinstances");
        })
    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res) {

    async.parallel({
        bookinstance(callback) {
            BookInstance.findById(req.params.id).exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        if (results.bookinstance==null) {
            var err = new Error("Book Instance not found");
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render("bookinstance_form", {title: "Update Book Instance", bookinstance: results.bookinstance})
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [

    // Validate and sanitize fields.
    /* body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(), */
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            res.render('bookinstance_form', { title: 'Create BookInstance', errors: errors.array(), bookinstance: bookinstance });
            return;
        }
        else {
            // Data from form is valid.
            /* bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
            }); */

            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, thebookinstance) {
                if (err) {
                    return next(err);
                }
                // Succesful - redirect to book instance detail page.
                res.redirect(thebookinstance.url);
            })
        }
    }
];
