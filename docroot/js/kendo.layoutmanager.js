(function($, kendo){

    var ui = kendo.ui;
    var Widget = ui.Widget;

    function widget(element) {
        return element instanceof Widget ? element
            : element instanceof $ ? (kendo.widgetInstance(element, ui) ||
                                      kendo.widgetInstance(element, kendo.mobile.ui) ||
                                      kendo.widgetInstance(element, kendo.dataviz.ui) ||
                                      new Bogus(element))
            : null;
    }

    function element(widget) {
        return widget instanceof $ ? widget
            : widget instanceof Widget ? widget.element
            : typeof widget == "string" ? $(widget)
            : widget;
    }

    function resizeWidget(widget, width, height) {
        if (typeof widget.setOuterSize == "function") {
            return widget.setOuterSize(width, height);
        }
        element(widget).css({
            width: width + "px",
            height: height + "px"
        });
    }

    function reposWidget(widget, left, top) {
        if (typeof widget.setPosition == "function") {
            return widget.setPosition(top, left);
        }
        element(widget).css({
            left: parseFloat(left) + "px",
            top: parseFloat(top) + "px"
        });
    }

    function getWidgetSize(widget, axis) {
        var el = element(widget);
        if (axis == "x") {
            el.css("width", "");
            return el.outerWidth();
        }
        if (axis == "y") {
            el.css("height", "");
            return el.outerHeight();
        }
    }

    function getFill(f) {
        if (typeof f == "object") return f;
        if (f == null)
            return { type: "fixed" };
        if (typeof f == "number")
            return { type: "fixed", fill: f };
        if (/\%$/.test(f))
            return { type: "percent", fill: parseInt(f, 10) };
        return { type: "fraction", fill: parseFloat(f) };
    }

    var LayoutManager = Widget.extend({
        options: {
            name        : "LayoutManager",
            orientation : "horizontal",
            widgets     : null
        },
        init: function(element, options) {
            var self = this;
            Widget.fn.init.call(self, element, options);
            options = self.options;
            if (!options.widgets) {
                options.widgets = element.children().map(function(){
                    return [
                        widget($(this)),
                        getFill($(this).attr("kendo-layout"))
                    ];
                }).get();
            }
            options.widgets.forEach(function(w){
                if (w[0] instanceof $) w[0] = widget(w[0]);
                if (!(w[0] instanceof Widget)) {
                    // assume ad-hoc layout widget.
                    w[0] = $("<div></div>").kendoLayoutManager(w[0]).data("kendoLayoutManager");
                }
                w[1] = getFill(w[1]);
                self.element.append(w[0].element);
            });
            self.element.addClass("kendo-layoutmanager");
        },
        update: function() {
            var layout = this._computeLayout(this.element.outerWidth(),
                                             this.element.outerHeight());
            layout.forEach(function(a){
                var w = a[0], g = a[2];
                reposWidget(w, g.x, g.y);
                resizeWidget(w, g.w, g.h);
            });
        },
        setOuterSize: function(width, height) {
            this.element.css({
                width: width + "px",
                height: height + "px"
            })
            this.update();
        },

        _computeLayout: function(width, height) {
            var self = this;
            var options = self.options;
            var rem_width = width, rem_height = height;
            var widgets = options.widgets;
            function limit(f, sz) {
                if (f.min != null && sz < f.min) sz = f.min;
                if (f.max != null && sz > f.max) sz = f.max;
                return sz;
            }
            widgets.forEach(function(a){
                var f = a[1];
                var widget = a[0];
                var sz;

                sz = f.fill;
                if (f.type == "fraction") sz = 0;
                switch (options.orientation) {
                  case "horizontal":
                    if (sz == null) sz = getWidgetSize(widget, "x");
                    else if (f.type == "percent") sz = width * f.fill / 100;
                    sz = limit(f, sz);
                    rem_width -= sz;
                    a[2] = { x: 0, y: 0, w: sz, h: height };
                    break;
                  case "vertical":
                    if (sz == null) sz = getWidgetSize(widget, "y");
                    else if (f.type == "percent") sz = height * f.fill / 100;
                    sz = limit(f, sz);
                    rem_height -= sz;
                    a[2] = { x: 0, y: 0, w: width, h: sz };
                    break;
                }
            });
            var prev_x = 0, prev_y = 0;
            widgets.forEach(function(a){
                var f = a[1];
                switch (options.orientation) {
                  case "horizontal":
                    if (f.type == "fraction")
                        a[2].w = limit(f, rem_width * f.fill);
                    a[2].x = prev_x;
                    prev_x += a[2].w;
                    break;
                  case "vertical":
                    if (f.type == "fraction")
                        a[2].h = limit(f, rem_height * f.fill);
                    a[2].y = prev_y;
                    prev_y += a[2].h;
                    break;
                }
            });
            return widgets;
        }
    });

    ui.plugin(LayoutManager);

    var Bogus = LayoutManager.Bogus = Widget.extend({
        options: { name: "Bogus" }
    });

})(jQuery, window.kendo);

//// XXX: to be moved in kendo.window.js?

kendo.ui.Window.fn.getInnerSize = function() {
    var content = this.wrapper.find(".k-window-content");
    return {
        x: content.width(),
        y: content.height()
    };
};
