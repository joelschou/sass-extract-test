const sassExtract = require('sass-extract');

sassExtract.render({
    file: 'test.scss'
})
.then(rendered => {
    console.log(rendered.vars);
    console.log(rendered.css.toString());
});
