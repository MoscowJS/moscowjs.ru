$(function () {
  Parse.initialize(
    "dz8YZ3MDQKztmmHFa4hlWwxeI01TASxYQcQbIi0Z",
    "WLzUuXD8laIM8br5WGalwy2Z0u7x4J8zZxJ2y6RW");

  $('form.talk').submit(function ($ev) {
    $ev.preventDefault();
    var $form = $($ev.target).closest('form'),
        $thankYou = $form.siblings('.thank-you'),
        $error = $form.siblings('.error'),
        data = {},
        Talk = Parse.Object.extend("Talk"),
        talk = new Talk();

    $form.hide();

    $form.serializeArray().forEach(function (field) {
      data[field.name] = field.value;
    });

    talk.save(data)
      .then(function () {
        $thankYou.show();
      }, function () {
        $error.show();
      })
      .done();
  });
});
