require 'date'
require 'facets/integer/ordinal'

module Jekyll
  module DateFilter
    def date_ordinal(date)
      "#{date.strftime('%b')} #{date.strftime('%d').to_i.ordinalize}, #{date.strftime('%Y')}"
    end
  end
end

Liquid::Template.register_filter(Jekyll::DateFilter)
